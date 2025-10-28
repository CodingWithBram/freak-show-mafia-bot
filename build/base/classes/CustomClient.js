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
const Handler_1 = __importDefault(require("./Handler"));
class CustomClient extends discord_js_1.Client {
    constructor() {
        super({
            intents: [
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
            ],
        });
        this.config = require(`${process.cwd()}/data/config.json`);
        this.handler = new Handler_1.default(this);
        this.commands = new discord_js_1.Collection();
        this.subCommands = new discord_js_1.Collection();
        this.cooldowns = new discord_js_1.Collection();
        this.developerMode = process.argv.includes("development");
    }
    Init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.LoadHandlers();
            const token = process.env.TOKEN || this.config.token;
            if (!token) {
                console.error("❌ No token found in environment or config.json!");
            }
            else {
                console.log("✅ Token found, first few characters:", token.substring(0, 10));
            }
            yield this.login(token).catch((err) => console.error(err));
        });
    }
    LoadHandlers() {
        this.handler.LoadEvents();
    }
}
exports.default = CustomClient;
