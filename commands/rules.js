export const command = 'rules';
export const execute = async (sock, m, jid) => {
  const rules = `
📜 *Group Rules* 📜
1. Be respectful
2. No spamming
3. No links without permission
4. Have fun 🎉
`;
  await sock.sendMessage(jid, { text: rules });
};
