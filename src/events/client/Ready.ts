import Event from "../../base/classes/Event";
import { Collection, Events, REST, Routes } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Command from "../../base/classes/Command";

export default class Ready extends Event {
    constructor(client: CustomClient) {
        super(client, {
            name: Events.ClientReady,
            description: "Event triggered when the client is ready.",
            once: true,
        });
    }

    async Execute() {
        console.log(`${this.client.user?.tag} is now ready!`);

        const commands: object[] = this.GetJson(this.client.commands);

        // Use environment variable if available, fallback to config.json
        const token = process.env.TOKEN || this.client.config.token;
        const clientId = process.env.CLIENT_ID || this.client.config.clientId;
        const guildId = process.env.GUILD_ID || this.client.config.guildId;

        if (!token || !clientId || !guildId) {
            throw new Error("❌ Missing TOKEN, CLIENT_ID, or GUILD_ID. Check your environment variables or config.json.");
        }

        const rest = new REST().setToken(token);

        const setCommands: any = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`✅ Successfully registered ${setCommands.length} application commands.`);
    }

    private GetJson(commands: Collection<string, Command>): object[] {
        const data: object[] = [];

        commands.forEach((command) => {
            data.push({
                name: command.name,
                description: command.description,
                options: command.options,
                default_member_permissions: command.default_member_permissions?.toString(),
                dm_permission: command.dm_permission,
            });
        });

        return data;
    }
}
