import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';

export const command = 'sticker';
export const execute = async (sock, m, jid) => {
  if (!m.message.imageMessage) {
    return sock.sendMessage(jid, { text: '❗ Send an image with `.sticker`' });
  }

  const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: console });
  const fileName = `${tmpdir()}/${randomUUID()}.webp`;

  writeFileSync(fileName, buffer);

  await sock.sendMessage(jid, { sticker: buffer });
};
