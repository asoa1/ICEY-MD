export const command = 'flirt';

export async function execute(sock, m, jid) {
  const messageCache = global.messageCache;

  let lastMsgText = '';
  for (let msg of [...messageCache.values()].reverse()) {
    if (msg.key.remoteJid === jid && !msg.key.fromMe) {
      const content = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (content && content.length > 2) {
        lastMsgText = content;
        break;
      }
    }
  }

  const text = lastMsgText.toLowerCase();
  let reply;

  // === Emoji + text logic ===
  if (text.includes("😔") || text.includes("😢") || text.includes("sad")) {
    reply = "A pretty face like yours should never frown 😟. Let me be the reason you smile 💘";
  } else if (text.includes("😂") || text.includes("🤣") || text.includes("lol")) {
    reply = "Your laugh just gave me a reason to fall harder 😄💖";
  } else if (text.includes("😍") || text.includes("❤️") || text.includes("beautiful")) {
    reply = "You just said something cute, but you're even cuter 😘";
  } else if (text.includes("😡") || text.includes("angry") || text.includes("annoyed")) {
    reply = "Uh-oh, who made you mad? Let me steal you away for a smile instead 😇";
  } else {
    const backups = [
      "Even your emojis make my day better 😊",
      "You just dropped an emoji, but you’re the real expression I crave 😏",
      "Flirting with you is the highlight of my day 🔥",
      "If hearts could speak, mine would just say your name 💓"
    ];
    reply = backups[Math.floor(Math.random() * backups.length)];
  }

  await sock.sendMessage(jid, { text: `💘 ${reply}` });
}
