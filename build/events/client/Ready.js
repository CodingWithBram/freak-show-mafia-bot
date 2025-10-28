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
const Event_1 = __importDefault(require("../../base/classes/Event"));
const discord_js_1 = require("discord.js");
class Ready extends Event_1.default {
    constructor(client) {
        super(client, {
            name: discord_js_1.Events.ClientReady,
            description: "Event triggered when the client is ready.",
            once: true,
        });
    }
    Execute() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag} is now ready!`);
            const commands = this.GetJson(this.client.commands);
            const rest = new discord_js_1.REST().setToken(this.client.config.token);
            const setCommands = yield rest.put(discord_js_1.Routes.applicationGuildCommands(this.client.config.clientId, this.client.config.guildId), {
                body: commands
            });
            console.log(`Successfully registered ${setCommands.length} application commands.`);
        });
    }
    GetJson(commands) {
        const data = [];
        commands.forEach(command => {
            data.push({
                name: command.name,
                description: command.description,
                options: command.options,
                default_member_permissions: command.default_member_permissions.toString(),
                dm_permission: command.dm_permission,
            });
        });
        return data;
    }
}
exports.default = Ready;
