export const command = 'hug';

export async function execute(sock, msg) {
  const hugStickerPath = './media/hug.gif'; // Make sure this file exists

  if (!fs.existsSync(hugStickerPath)) {
    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Hug sticker not found.' }, { quoted: msg });
    return;
  }

  const buffer = fs.readFileSync(hugStickerPath);
  await sock.sendMessage(msg.key.remoteJid, {
    sticker: buffer
  }, { quoted: msg });
}
