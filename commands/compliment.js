export const command = 'compliment';
export const execute = async (sock, m, jid) => {
  const lines = [
    "You're like sunshine on a rainy day. ☀️",
    "You're more beautiful than a sunset. 🌇",
    "Your smile can light up the whole room. 😁"
  ];
  await sock.sendMessage(jid, { text: lines[Math.floor(Math.random() * lines.length)] });
};
