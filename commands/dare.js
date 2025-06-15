export const command = 'dare';
export const execute = async (sock, m, jid) => {
  const dares = [
    "🎤 Sing your favorite song and send a voice note.",
    "🕺 Do 10 pushups and send a video.",
    "😂 Say 'I love goats' to the last person you texted."
  ];
  await sock.sendMessage(jid, { text: dares[Math.floor(Math.random() * dares.length)] });
};
