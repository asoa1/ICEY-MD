export const command = 'promote';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) return sock.sendMessage(jid, { text: '❗ This command only works in groups.' });

  const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentions || mentions.length === 0) {
    return sock.sendMessage(jid, { text: '❗ Please mention a user to promote.' });
  }

  try {
    await sock.groupParticipantsUpdate(jid, mentions, 'promote');
    await sock.sendMessage(jid, {
      text: `🛡️ Promoted: ${mentions.map(j => `@${j.split('@')[0]}`).join(', ')}`,
      mentions
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: '❌ Failed to promote user.' });
  }
};
