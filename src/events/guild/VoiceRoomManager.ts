import {
    ChannelType,
    Events,
    Guild,
    VoiceBasedChannel,
    VoiceChannel,
    VoiceState,
} from "discord.js";
import Event from "../../base/classes/Event";
import CustomClient from "../../base/classes/CustomClient";
import IConfig from "../../base/interfaces/IConfig"; // Make sure this path matches your project

export default class VoiceRoomManager extends Event {
    private managedChannels: Set<string>;
    private memberRooms: Map<string, string>;

    constructor(client: CustomClient) {
        super(client, {
            name: Events.VoiceStateUpdate,
            description: "Creates ad-hoc personal voice rooms when members join the lobby channel.",
            once: false,
        });

        this.managedChannels = new Set();
        this.memberRooms = new Map();
    }

    async Execute(oldState: VoiceState, newState: VoiceState): Promise<void> {
        const config = this.getConfig();
        if (!config) return;

        // Handle if someone left a managed channel
        await this.handleVacatedChannel(oldState);

        // Only trigger when someone joins the hub channel
        if (newState.channelId !== config.hubChannelId) return;
        if (!newState.member || newState.member.user.bot) return;

        const guild = newState.guild;
        const memberId = newState.member.id;

        // Check if the member already has a room
        const existingRoomId = this.memberRooms.get(memberId);
        if (existingRoomId) {
            const existingChannel = guild.channels.cache.get(existingRoomId);
            if (existingChannel && this.isVoiceChannel(existingChannel)) {
                await newState
                    .setChannel(existingChannel, "Moving member to their existing voice room.")
                    .catch((error) =>
                        console.error("[VoiceRoomManager] Failed to move member:", error)
                    );
                return;
            }

            // Clean up broken references
            this.memberRooms.delete(memberId);
            this.managedChannels.delete(existingRoomId);
        }

        // Limit how many personal rooms can exist
        if (config.maxRooms && this.managedChannels.size >= config.maxRooms) {
            console.warn("[VoiceRoomManager] Maximum number of managed voice rooms reached.");
            return;
        }

        const channel = await this.createVoiceRoom(guild, newState.member.displayName, config);
        if (!channel) return;

        this.managedChannels.add(channel.id);
        this.memberRooms.set(memberId, channel.id);

        await newState
            .setChannel(channel, "Moving member to their personal voice room.")
            .catch((error) => {
                console.error("[VoiceRoomManager] Failed to move member:", error);
            });
    }

    private getConfig(): IConfig | null {
        const config = this.client.config as IConfig;
        if (!config?.hubChannelId) {
            console.warn("[VoiceRoomManager] Missing hubChannelId in config.");
            return null;
        }
        return config;
    }

    private async handleVacatedChannel(oldState: VoiceState): Promise<void> {
        const channel = oldState.channel;
        if (!channel) return;

        if (!this.managedChannels.has(channel.id)) return;

        if (channel.members.size === 0) {
            await this.destroyVoiceRoom(channel, "Channel empty after members left.");
        }
    }

    private async createVoiceRoom(
        guild: Guild,
        displayName: string,
        config: IConfig
    ): Promise<VoiceChannel | null> {
        const channelName = this.buildChannelName(displayName);

        try {
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: config.categoryId,
                userLimit: config.userLimit,
                reason: `Auto-generated voice room for ${displayName}`,
            });

            return this.isVoiceChannel(channel) ? channel : null;
        } catch (error) {
            console.error("[VoiceRoomManager] Failed to create voice room:", error);
            return null;
        }
    }

    private async destroyVoiceRoom(channel: VoiceBasedChannel, reason: string) {
        this.managedChannels.delete(channel.id);

        for (const [userId, channelId] of this.memberRooms) {
            if (channelId === channel.id) {
                this.memberRooms.delete(userId);
            }
        }

        if (!channel.deletable) return;

        try {
            await channel.delete(reason);
        } catch (error) {
            console.error("[VoiceRoomManager] Failed to delete voice room:", error);
        }
    }

    private buildChannelName(displayName: string): string {
        const baseName = displayName
            .replace(/[\n\r]+/g, " ")
            .replace(/[^\p{L}\p{N}\s'-]/gu, "")
            .trim();

        const finalName = baseName ? `${baseName}'s Room` : "Private Room";
        return finalName.substring(0, 100);
    }

    private isVoiceChannel(channel: any): channel is VoiceChannel {
        return channel?.type === ChannelType.GuildVoice;
    }
}
