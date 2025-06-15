export const command = 'autolike';

let autoLikeEnabled = false;
const reacted = new Set();

export async function execute(sock, m, jid) {
  autoLikeEnabled = !autoLikeEnabled;
  reacted.clear();

  await sock.sendMessage(jid, {
    text: autoLikeEnabled
      ? '✅ Auto‑like status is now *ON*.'
      : '❌ Auto‑like status is now *OFF*.'
  });
}

export function monitor(sock) {
  sock.ev.on('status.update', async ({ status }) => {
    if (!autoLikeEnabled) return;

    for (const s of status) {
      const id = s.key?.id;
      const from = s.key?.fromMe ? sock.user.id : s.key?.participant;
      const statusFrom = s.key?.remoteJid;

      if (!id || !from || !statusFrom) continue;
      const unique = `${statusFrom}:${id}`;
      if (reacted.has(unique)) continue;
      reacted.add(unique);

      try {
        await sock.sendMessage(statusFrom, {
          react: {
            text: '❤️',
            key: { id, fromMe: false, remoteJid: statusFrom }
          }
        }, { statusJidList: [statusFrom] });
        console.log(`❤️ reacted to status from ${statusFrom}`);
      } catch (err) {
        console.error('❌ autolike react failed:', err);
      }
    }
  });
}
