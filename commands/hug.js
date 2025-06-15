import fs from 'fs';
import path from 'path';

export const command = 'hug';

export async function execute(sock, msg) {
  const hugStickerPath = './media/hug.webp';

  if (!fs.existsSync(hugStickerPath)) {
    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Hug sticker not found.' }, { quoted: msg });
    return;
  }

  const buffer = fs.readFileSync(hugStickerPath);

  await sock.sendMessage(msg.key.remoteJid, {
    sticker: buffer
  }, { quoted: msg });
}
