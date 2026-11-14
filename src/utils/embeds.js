import { EmbedBuilder } from 'discord.js';

export function createEmbed({
  title,
  description,
  color = 0x5865f2,
  fields = [],
  footer,
  thumbnail,
  image,
  timestamp = true,
} = {}) {
  const embed = new EmbedBuilder().setColor(color);

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (footer) embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (timestamp) embed.setTimestamp();

  return embed;
}
