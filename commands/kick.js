export const command = 'kick';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) return sock.sendMessage(jid, { text: '❗ Only for groups.' });

  const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length === 0) return sock.sendMessage(jid, { text: '❗ Mention a user to kick.' });

  for (const user of mentions) {
    await sock.groupParticipantsUpdate(jid, [user], 'remove');
  }

  await sock.sendMessage(jid, { text: '👢 Kicked the mentioned user(s).' });
};
