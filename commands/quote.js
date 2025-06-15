export const command = 'quote';
export const execute = async (sock, m, jid) => {
  const quotes = [
    "🌟 Believe you can and you're halfway there.",
    "🔥 Push yourself, because no one else is going to do it for you.",
    "💡 Success is not for the lazy."
  ];
  await sock.sendMessage(jid, { text: quotes[Math.floor(Math.random() * quotes.length)] });
};
