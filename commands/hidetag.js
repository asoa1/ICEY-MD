export const command = 'hidetag';
export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) return sock.sendMessage(jid, { text: '❗ This command only works in groups.' });

  const groupMetadata = await sock.groupMetadata(jid);
  const participants = groupMetadata.participants.map(p => p.id);

  // Combine all possible text sources
  const rawText =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    '';

  // Remove the command (.hidetag) and keep only the actual message
  const messageBody = rawText.trim().replace(/^\.hidetag\s*/i, '').trim();

  const finalMessage = messageBody || '👋';

  await sock.sendMessage(jid, {
    text: finalMessage,
    mentions: participants
  });
};
