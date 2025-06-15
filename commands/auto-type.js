export const command = 'auto-type';
let autoTyping = false;
let typingInterval;
let lastChat = null;

export async function execute(sock, m, jid) {
  const text = (
    m.message.conversation ||
    m.message.extendedTextMessage?.text || ''
  ).trim().toLowerCase();

  const arg = text.split(' ')[1];

  if (arg !== 'on' && arg !== 'off') {
    return sock.sendMessage(jid, {
      text: '❗ Usage: `.auto-type on` or `.auto-type off`',
      quoted: m
    });
  }

  if (arg === 'on') {
    if (autoTyping) {
      return sock.sendMessage(jid, {
        text: '✅ Auto typing is already ON.',
        quoted: m
      });
    }

    autoTyping = true;
    lastChat = jid;

    typingInterval = setInterval(async () => {
      if (lastChat) {
        await sock.sendPresenceUpdate('available', lastChat); // online
        await sock.sendPresenceUpdate('composing', lastChat); // typing
      }
    }, 5000);

    await sock.sendMessage(jid, {
      text: '✅ Auto typing enabled.',
      quoted: m
    });
  }

  if (arg === 'off') {
    autoTyping = false;
    clearInterval(typingInterval);
    lastChat = null;
    await sock.sendPresenceUpdate('paused', jid); // stop typing
    await sock.sendMessage(jid, {
      text: '🛑 Auto typing disabled.',
      quoted: m
    });
  }
}
