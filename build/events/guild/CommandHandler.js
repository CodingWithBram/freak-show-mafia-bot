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
class CommandHandler extends Event_1.default {
    constructor(client) {
        super(client, {
            name: discord_js_1.Events.InteractionCreate,
            description: "Handles slash commands and moderation actions.",
            once: false,
        });
    }
    Execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // --- Slash commands (your existing code kept here) ---
            if (interaction.isChatInputCommand()) {
                const command = this.client.commands.get(interaction.commandName);
                if (!command) {
                    yield interaction.reply({
                        content: "Command not found.",
                        ephemeral: true,
                    });
                    this.client.commands.delete(interaction.commandName);
                    return;
                }
                const { cooldowns } = this.client;
                if (!cooldowns.has(command.name))
                    cooldowns.set(command.name, new discord_js_1.Collection());
                const now = Date.now();
                const timestamps = cooldowns.get(command.name);
                const cooldownAmount = (command.cooldown || 3) * 1000;
                if (timestamps.has(interaction.user.id) &&
                    now < (timestamps.get(interaction.user.id) || 0) + cooldownAmount) {
                    yield interaction.reply({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`❌ Please wait another \`${(((timestamps.get(interaction.user.id) || 0) +
                                cooldownAmount -
                                now) /
                                1000).toFixed(1)}\` seconds before using \`${command.name}\` again.`),
                        ],
                        ephemeral: true,
                    });
                    return;
                }
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
                try {
                    const subCommandGroup = interaction.options.getSubcommandGroup(false);
                    const subCommand = `${interaction.commandName}${subCommandGroup ? `.${subCommandGroup}` : ""}.${interaction.options.getSubcommand(false) || ""}`;
                    const subCmd = this.client.subCommands.get(subCommand);
                    if (subCmd) {
                        subCmd.Execute(interaction);
                    }
                    else {
                        command.Execute(interaction);
                    }
                }
                catch (ex) {
                    console.log(ex);
                }
                return;
            }
        });
    }
}
exports.default = CommandHandler;
