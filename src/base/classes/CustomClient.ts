import { Client, Collection, GatewayIntentBits, TextChannel } from "discord.js";
import IConfig from "../interfaces/IConfig";
import Handler from "./Handler";
import Command from "./Command";
import SubCommand from "./SubCommand";

export default class CustomClient extends Client {
  handler: Handler;
  config: IConfig;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  cooldowns: Collection<string, Collection<string, number>>;
  developerMode: boolean;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages, // ✅ Needed for sending messages
      ],
    });

    this.config = require(`${process.cwd()}/data/config.json`);
    this.handler = new Handler(this);
    this.commands = new Collection();
    this.subCommands = new Collection();
    this.cooldowns = new Collection();
    this.developerMode = process.argv.includes("development");
  }

  public async Init(): Promise<void> {
    this.LoadHandlers();

    const token = process.env.TOKEN || this.config.token;

    if (!token) {
      console.error("❌ No token found in environment or config.json!");
    } else {
      console.log("✅ Token found, first few characters:", token.substring(0, 10));
    }

    await this.login(token).catch((err) => console.error(err));

    // ✅ Send "Bot is still online" every 200 seconds after the bot is ready
    this.once("ready", () => {
      console.log(`✅ Logged in as ${this.user?.tag}`);

      const CHANNEL_ID = "1432852656765796393"; // 🔥 replace with your channel ID
      const channel = this.channels.cache.get(CHANNEL_ID) as TextChannel;

      if (!channel) {
        console.error("❌ Could not find the target channel for status messages!");
        return;
      }

      setInterval(() => {
        channel.send("✅ Bot is still online").catch(console.error);
      }, 200_000); // every 200 seconds
    });
  }

  private LoadHandlers(): void {
    this.handler.LoadEvents();
  }
}
