import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;

export const command = 'setpp';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  const sender = m.key.participant || m.key.remoteJid;

  if (!isGroup) {
    await sock.sendMessage(jid, { text: '❌ This command only works in groups.' });
    return;
  }

  const groupMetadata = await sock.groupMetadata(jid);
  const isAdmin = groupMetadata.participants.some(p => p.id === sender && p.admin);

  if (!isAdmin) {
    await sock.sendMessage(jid, { text: '🚫 Only group admins can use this command.' });
    return;
  }

  const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const image = quotedMsg?.imageMessage;

  if (!image) {
    await sock.sendMessage(jid, { text: '❗Please reply to an image to set as group DP.' });
    return;
  }

  try {
    const mediaBuffer = await downloadMediaMessage(
      {
        key: {
          remoteJid: jid,
          id: m.message.extendedTextMessage.contextInfo.stanzaId,
          fromMe: false,
          participant: m.message.extendedTextMessage.contextInfo.participant
        },
        message: quotedMsg
      },
      'buffer',
      {},
      { logger: console }
    );

    await sock.updateProfilePicture(jid, mediaBuffer);
    await sock.sendMessage(jid, { text: '✅ Group profile picture updated successfully!' });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, { text: '❌ Failed to set group profile picture.' });
  }
};
