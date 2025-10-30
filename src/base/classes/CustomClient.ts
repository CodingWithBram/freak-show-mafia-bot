import { Client, Collection, GatewayIntentBits } from "discord.js";
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
    }
    
  
  private LoadHandlers(): void {
    this.handler.LoadEvents();
  }
}
