export const command = 'getpp';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  let targetJid;

  if (isGroup && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    // Get mentioned user
    targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
  } else if (isGroup && !m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
    // Get group profile pic
    targetJid = jid;
  } else {
    // Private chat
    targetJid = jid;
  }

  try {
    const pfpUrl = await sock.profilePictureUrl(targetJid, 'image');
    await sock.sendMessage(jid, {
      image: { url: pfpUrl },
      caption: `🖼️ Profile picture of ${targetJid.split('@')[0]}`
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: '❌ No profile picture found or unable to fetch it.' });
  }
};
