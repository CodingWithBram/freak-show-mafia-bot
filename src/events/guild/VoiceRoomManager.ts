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

export default class VoiceRoomManager extends Event {
    private managedChannels: Set<string>;
    private memberRooms: Map<string, string>;

    // 🔥 Hardcoded values
    private readonly HUB_CHANNEL_ID = "1432852656765796393";
    private readonly CATEGORY_ID = "1432852416566661220";
    private readonly BITRATE = 64000;
    private readonly USER_LIMIT = 15;
    private readonly MAX_ROOMS = 15;

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
        // Handle if someone left a managed channel
        await this.handleVacatedChannel(oldState);

        // Only trigger when someone joins the hub channel
        if (newState.channelId !== this.HUB_CHANNEL_ID) return;
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
        if (this.managedChannels.size >= this.MAX_ROOMS) {
            console.warn("[VoiceRoomManager] Maximum number of managed voice rooms reached.");
            return;
        }

        const channel = await this.createVoiceRoom(guild, newState.member.displayName);
        if (!channel) return;

        this.managedChannels.add(channel.id);
        this.memberRooms.set(memberId, channel.id);

        await newState
            .setChannel(channel, "Moving member to their personal voice room.")
            .catch((error) => {
                console.error("[VoiceRoomManager] Failed to move member:", error);
            });
    }

    private async handleVacatedChannel(oldState: VoiceState): Promise<void> {
        const channel = oldState.channel;
        if (!channel) return;

        // Either it's tracked OR it looks like a managed channel (optional pattern check)
        if (!this.managedChannels.has(channel.id) && !channel.name.endsWith("'s Room")) return;

        if (channel.members.size === 0) {
            console.log(`[VoiceRoomManager] Deleting empty channel: ${channel.name}`);
            await this.destroyVoiceRoom(channel, "Channel empty after members left.");
        }
    }

    private async createVoiceRoom(guild: Guild, displayName: string): Promise<VoiceChannel | null> {
        const channelName = this.buildChannelName(displayName);

        try {
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: this.CATEGORY_ID,
                userLimit: this.USER_LIMIT,
                bitrate: this.BITRATE,
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
