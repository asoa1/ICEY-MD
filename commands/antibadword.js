const antiBadwordGroups = new Set();
const offensiveWords = ['fuck', 'bitch', 'stupid', 'mad', 'idiot', 'asshole', 'motherfucker'];

export const command = 'antibadword';

export async function execute(sock, m, jid) {
  const isGroup = jid.endsWith('@g.us');
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

  if (!isGroup) {
    await sock.sendMessage(jid, { text: '⚠️ This command works only in groups.' });
    return;
  }

  const option = text.split(' ')[1];
  if (option === 'on') {
    antiBadwordGroups.add(jid);
    await sock.sendMessage(jid, { text: '🛡️ Anti-badword is now *ON* for this group.' });
  } else if (option === 'off') {
    antiBadwordGroups.delete(jid);
    await sock.sendMessage(jid, { text: '❌ Anti-badword is now *OFF* for this group.' });
  } else {
    await sock.sendMessage(jid, { text: 'ℹ️ Use `.antibadword on` or `.antibadword off`' });
  }
}

// 👇 Optional monitor — to scan all messages
export function monitor(sock) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || !m.key.remoteJid.endsWith('@g.us')) return;

    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

    if (!antiBadwordGroups.has(jid)) return;

    const lowerText = text.toLowerCase();
    const usedBadword = offensiveWords.find(word => lowerText.includes(word));

    if (usedBadword) {
      try {
        await sock.sendMessage(jid, {
          text: `⚠️ *Warning!* Offensive word detected. Message deleted.`,
          mentions: [sender]
        });

        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: m.key.id,
            participant: sender
          }
        });
      } catch (err) {
        console.error('❌ Failed to delete offensive message:', err);
      }
    }
  });
}
