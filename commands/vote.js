export const command = 'vote';
export const execute = async (sock, m, jid) => {
  const question = m.message?.conversation?.split(' ').slice(1).join(' ');
  if (!question) return sock.sendMessage(jid, { text: '❗ Example: .vote Should we do a voice call?' });

  await sock.sendMessage(jid, {
    poll: {
      name: question,
      values: ['Yes 👍', 'No 👎']
    }
  });
};
