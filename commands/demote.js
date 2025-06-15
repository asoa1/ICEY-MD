export const command = 'demote';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) return sock.sendMessage(jid, { text: '❗ This command only works in groups.' });

  const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentions || mentions.length === 0) {
    return sock.sendMessage(jid, { text: '❗ Please mention a user to demote.' });
  }

  try {
    await sock.groupParticipantsUpdate(jid, mentions, 'demote');
    await sock.sendMessage(jid, {
      text: `⚠️ Demoted: ${mentions.map(j => `@${j.split('@')[0]}`).join(', ')}`,
      mentions
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: '❌ Failed to demote user.' });
  }
};
