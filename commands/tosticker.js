import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export const command = 'tosticker';
export const execute = async (sock, m, jid) => {
  const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const context = m.message?.extendedTextMessage?.contextInfo;

  if (!quotedMsg || !context) {
    return await sock.sendMessage(jid, { text: '❗Reply to an image or short video to make it a sticker.' });
  }

  let messageType, media;

  if (quotedMsg.imageMessage) {
    messageType = 'image';
    media = quotedMsg.imageMessage;
  } else if (quotedMsg.videoMessage && quotedMsg.videoMessage.seconds <= 10) {
    messageType = 'video';
    media = quotedMsg.videoMessage;
  } else {
    return await sock.sendMessage(jid, { text: '❌ Please reply to an image or video under 10 seconds.' });
  }

  try {
    const stream = await downloadContentFromMessage(media, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    await sock.sendMessage(jid, { sticker: buffer }, { quoted: m });
  } catch (err) {
    console.error('Error:', err);
    await sock.sendMessage(jid, { text: '❌ Failed to convert media to sticker.' });
  }
};
