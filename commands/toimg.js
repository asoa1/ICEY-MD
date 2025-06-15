import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;

export const command = 'toimg';
export const execute = async (sock, m, jid) => {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const sticker = quoted?.stickerMessage;

  if (!sticker || sticker.isAnimated) {
    await sock.sendMessage(jid, { text: '❌ Please reply to a non-animated sticker.' });
    return;
  }

  try {
    const mediaBuffer = await downloadMediaMessage(
      { key: m.message.extendedTextMessage.contextInfo.stanzaId, message: quoted },
      'buffer',
      {},
      { logger: console }
    );

    await sock.sendMessage(jid, { image: mediaBuffer }, { quoted: m });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, { text: '❌ Failed to convert sticker to image.' });
  }
};
