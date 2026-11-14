const FOOTER_USER_ID = '1458632297380057316';
const FALLBACK_FOOTER_ICON =
  'https://cdn.discordapp.com/avatars/1458632297380057316/e8e2b3873a519e075e515b1294786f3c.png?size=2048';

export async function getFooterIcon(client) {
  try {
    const user = await client.users.fetch(FOOTER_USER_ID);
    return user.displayAvatarURL({ size: 256, extension: 'png' });
  } catch {
    return FALLBACK_FOOTER_ICON;
  }
}
