export const command = 'auto-record';
let autoRecording = false;
let recordInterval;
let lastChat = null;

export async function execute(sock, m, jid) {
  const text = (
    m.message.conversation ||
    m.message.extendedTextMessage?.text || ''
  ).trim().toLowerCase();

  const arg = text.split(' ')[1];

  if (arg !== 'on' && arg !== 'off') {
    return sock.sendMessage(jid, {
      text: '❗ Usage: `.auto-record on` or `.auto-record off`',
      quoted: m
    });
  }

  if (arg === 'on') {
    if (autoRecording) {
      return sock.sendMessage(jid, {
        text: '🎙️ Auto recording is already ON.',
        quoted: m
      });
    }

    autoRecording = true;
    lastChat = jid;

    recordInterval = setInterval(async () => {
      if (lastChat) {
        await sock.sendPresenceUpdate('available', lastChat); // online
        await sock.sendPresenceUpdate('recording', lastChat); // recording indicator
      }
    }, 5000);

    await sock.sendMessage(jid, {
      text: '🎙️ Auto recording enabled.',
      quoted: m
    });
  }

  if (arg === 'off') {
    autoRecording = false;
    clearInterval(recordInterval);
    lastChat = null;
    await sock.sendPresenceUpdate('paused', jid); // stop presence
    await sock.sendMessage(jid, {
      text: '🛑 Auto recording disabled.',
      quoted: m
    });
  }
}
