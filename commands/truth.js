export const command = 'truth';
export const execute = async (sock, m, jid) => {
  const truths = [
    "😈 What’s your most embarrassing moment?",
    "👀 Have you ever stalked someone?",
    "🫣 What secret are you hiding from your best friend?"
  ];
  await sock.sendMessage(jid, { text: truths[Math.floor(Math.random() * truths.length)] });
};
