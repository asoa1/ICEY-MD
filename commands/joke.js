export const command = 'joke';
export const execute = async (sock, m, jid) => {
  const jokes = [
    "Why don’t skeletons fight each other? They don’t have the guts. 💀",
    "I told my computer I needed a break, and it said 'No problem. I’ll crash.' 😂",
    "Why did the scarecrow win an award? Because he was outstanding in his field. 🌾"
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  await sock.sendMessage(jid, { text: joke });
};
