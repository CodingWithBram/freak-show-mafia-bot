export default interface IConfig {
  token: string;
  clientId: string;
  guildId: string;

  voiceRooms?: {
    hubChannelId: string;
    categoryId?: string;
    userLimit?: number;
    maxRooms?: number;
  };
}
