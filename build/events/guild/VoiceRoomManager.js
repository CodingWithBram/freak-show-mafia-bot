"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Event_1 = __importDefault(require("../../base/classes/Event"));
class VoiceRoomManager extends Event_1.default {
    constructor(client) {
        super(client, {
            name: discord_js_1.Events.VoiceStateUpdate,
            description: "Creates ad-hoc personal voice rooms when members join the lobby channel.",
            once: false,
        });
        this.managedChannels = new Set();
        this.memberRooms = new Map();
    }
    Execute(oldState, newState) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = this.getConfig();
            if (!config)
                return;
            // Handle if someone left a managed channel
            yield this.handleVacatedChannel(oldState);
            // Only trigger when someone joins the hub channel
            if (newState.channelId !== config.hubChannelId)
                return;
            if (!newState.member || newState.member.user.bot)
                return;
            const guild = newState.guild;
            const memberId = newState.member.id;
            // Check if the member already has a room
            const existingRoomId = this.memberRooms.get(memberId);
            if (existingRoomId) {
                const existingChannel = guild.channels.cache.get(existingRoomId);
                if (existingChannel && this.isVoiceChannel(existingChannel)) {
                    yield newState
                        .setChannel(existingChannel, "Moving member to their existing voice room.")
                        .catch((error) => console.error("[VoiceRoomManager] Failed to move member:", error));
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
            const channel = yield this.createVoiceRoom(guild, newState.member.displayName, config);
            if (!channel)
                return;
            this.managedChannels.add(channel.id);
            this.memberRooms.set(memberId, channel.id);
            yield newState
                .setChannel(channel, "Moving member to their personal voice room.")
                .catch((error) => {
                console.error("[VoiceRoomManager] Failed to move member:", error);
            });
        });
    }
    getConfig() {
        const config = this.client.config;
        if (!(config === null || config === void 0 ? void 0 : config.hubChannelId)) {
            console.warn("[VoiceRoomManager] Missing hubChannelId in config.");
            return null;
        }
        return config;
    }
    handleVacatedChannel(oldState) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = oldState.channel;
            if (!channel)
                return;
            if (!this.managedChannels.has(channel.id))
                return;
            if (channel.members.size === 0) {
                yield this.destroyVoiceRoom(channel, "Channel empty after members left.");
            }
        });
    }
    createVoiceRoom(guild, displayName, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const channelName = this.buildChannelName(displayName);
            try {
                const channel = yield guild.channels.create({
                    name: channelName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: config.categoryId,
                    userLimit: config.userLimit,
                    reason: `Auto-generated voice room for ${displayName}`,
                });
                return this.isVoiceChannel(channel) ? channel : null;
            }
            catch (error) {
                console.error("[VoiceRoomManager] Failed to create voice room:", error);
                return null;
            }
        });
    }
    destroyVoiceRoom(channel, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            this.managedChannels.delete(channel.id);
            for (const [userId, channelId] of this.memberRooms) {
                if (channelId === channel.id) {
                    this.memberRooms.delete(userId);
                }
            }
            if (!channel.deletable)
                return;
            try {
                yield channel.delete(reason);
            }
            catch (error) {
                console.error("[VoiceRoomManager] Failed to delete voice room:", error);
            }
        });
    }
    buildChannelName(displayName) {
        const baseName = displayName
            .replace(/[\n\r]+/g, " ")
            .replace(/[^\p{L}\p{N}\s'-]/gu, "")
            .trim();
        const finalName = baseName ? `${baseName}'s Room` : "Private Room";
        return finalName.substring(0, 100);
    }
    isVoiceChannel(channel) {
        return (channel === null || channel === void 0 ? void 0 : channel.type) === discord_js_1.ChannelType.GuildVoice;
    }
}
exports.default = VoiceRoomManager;
