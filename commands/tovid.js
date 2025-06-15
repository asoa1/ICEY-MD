import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { exec } from 'child_process';

export const command = 'tovid';
export const execute = async (sock, m, jid) => {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const sticker = quoted?.stickerMessage;

  if (!sticker) {
    return await sock.sendMessage(jid, { text: '❗Reply to a video sticker to convert to video.' });
  }

  try {
    const stream = await downloadContentFromMessage(sticker, 'sticker');
    const buffer = await streamToBuffer(stream);

    const webpPath = path.join(tmpdir(), 'sticker.webp');
    const mp4Path = path.join(tmpdir(), 'output.mp4');
    fs.writeFileSync(webpPath, buffer);

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${webpPath} -movflags faststart -pix_fmt yuv420p ${mp4Path}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const videoBuffer = fs.readFileSync(mp4Path);
    await sock.sendMessage(jid, { video: videoBuffer }, { quoted: m });

    fs.unlinkSync(webpPath);
    fs.unlinkSync(mp4Path);
  } catch (err) {
    console.error('❌ .tovid error:', err);
    await sock.sendMessage(jid, { text: '❌ Failed to convert sticker to video.' });
  }
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
