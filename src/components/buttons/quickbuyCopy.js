import { MessageFlags } from 'discord.js';
import { getEmoji } from '../../services/applicationEmojis.js';

export default {
  customId: 'quickbuy_copy',
  async execute(interaction) {
    const [, userId, code] = interaction.customId.split(':');
    const quickBuyEmoji = getEmoji('QuickBuy');
    const warningEmoji = getEmoji('Warning');

    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: `${warningEmoji} **»** Este botão pertence a outro jogador.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!code) {
      await interaction.reply({
        content: `${warningEmoji} **»** Não foi possível encontrar o código da Compra Rápida.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: `${quickBuyEmoji} **»** Copie e cole no Mush (Lobby do Bed Wars): **\`/quickbuycode ${code}\`**.\n${warningEmoji} **»** Este comando serve para copiar o menu de compra rápida que está na imagem, usando esse comando tudo o que está salvo no seu menu de compra rápida será deletado.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
