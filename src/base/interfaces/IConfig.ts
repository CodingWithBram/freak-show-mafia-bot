export default interface IConfig {
  token: string;
  clientId: string;
  guildId: string;

  hubChannelId: string;
  categoryId?: string;
  userLimit?: number;
  maxRooms?: number;
}
