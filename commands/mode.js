export const command = 'mode';
let mode = 'public'; // default mode

export async function execute(sock, m, jid) {
  const sender = m.key.participant || m.key.remoteJid;
  const isMe = sender.includes(sock.user.id.split(':')[0]); // check if sender is the bot owner

  const text = (
    m.message.conversation ||
    m.message.extendedTextMessage?.text || ''
  ).trim().toLowerCase();

  const arg = text.split(' ')[1];

  if (!isMe) {
    return sock.sendMessage(jid, {
      text: '🚫 Only the bot owner can change mode.',
      quoted: m
    });
  }

  if (arg === 'public' || arg === 'private') {
    mode = arg;
    await sock.sendMessage(jid, {
      text: `🔧 Mode set to *${mode.toUpperCase()}*.`,
      quoted: m
    });
  } else {
    await sock.sendMessage(jid, {
      text: '❗ Use `.mode public` or `.mode private`',
      quoted: m
    });
  }
}

export function getMode() {
  return mode;
}
