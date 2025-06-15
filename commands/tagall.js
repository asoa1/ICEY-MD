export const command = 'tagall';
export const execute = async (sock, m, jid) => {
  const groupMetadata = await sock.groupMetadata(jid);
  const mentions = groupMetadata.participants.map(p => p.id);
  const text = mentions.map(id => `@${id.split('@')[0]}`).join(' ');
  await sock.sendMessage(jid, { text, mentions });
};
