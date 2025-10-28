import {
  Events,
  Interaction,
  CacheType,
  Collection,
  EmbedBuilder,
} from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import Command from "../../base/classes/Command";

export default class CommandHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Handles slash commands and moderation actions.",
      once: false,
    });
  }

  async Execute(interaction: Interaction<CacheType>): Promise<void> {
    // --- Slash commands (your existing code kept here) ---
    if (interaction.isChatInputCommand()) {
      const command: Command = this.client.commands.get(
        interaction.commandName
      )!;

      if (!command) {
        await interaction.reply({
          content: "Command not found.",
          ephemeral: true,
        });
        this.client.commands.delete(interaction.commandName);
        return;
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(command.name))
        cooldowns.set(command.name, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(command.name)!;
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (
        timestamps.has(interaction.user.id) &&
        now < (timestamps.get(interaction.user.id) || 0) + cooldownAmount
      ) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `❌ Please wait another \`${(
                  ((timestamps.get(interaction.user.id) || 0) +
                    cooldownAmount -
                    now) /
                  1000
                ).toFixed(1)}\` seconds before using \`${command.name}\` again.`
              ),
          ],
          ephemeral: true,
        });
        return;
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        const subCommandGroup = interaction.options.getSubcommandGroup(false);
        const subCommand = `${interaction.commandName}${
          subCommandGroup ? `.${subCommandGroup}` : ""
        }.${interaction.options.getSubcommand(false) || ""}`;
        const subCmd = this.client.subCommands.get(subCommand);
        if (subCmd) {
          subCmd.Execute(interaction);
        } else {
          command.Execute(interaction);
        }
      } catch (ex) {
        console.log(ex);
      }
      return;
    }
  }
}
