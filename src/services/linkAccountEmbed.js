import { EmbedBuilder } from 'discord.js';
import { getEmoji } from './applicationEmojis.js';

export function buildLinkAccountEmbed() {
  const minecraft = getEmoji('Minecraft') || '⛏️';
  const certo = getEmoji('Certo') || getEmoji('Correto') || '✅';
  const discord = getEmoji('Discord') || '💬';

  return new EmbedBuilder()
    .setColor(16438059)
    .setTitle('🔗・Vincular Conta')
    .setDescription(
      [
        `${minecraft} Abra seu **Minecraft** e vá para a lista de servidores;`,
        `${certo} Conecte-se no servidor **mush.com.br** e utilize **/discord**;`,
        `${discord} Após vincular com o Mush, e tudo ocorrer corretamente, você foi vinculado com sucesso!`,
      ].join('\n'),
    );
}
