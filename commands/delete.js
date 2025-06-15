export const command = 'delete';

export async function execute(sock, m, jid) {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
  const participant = m.message?.extendedTextMessage?.contextInfo?.participant;

  if (!quoted || !participant) {
    await sock.sendMessage(jid, { text: '⚠️ Reply to a message with `.delete` to delete it.' });
    return;
  }

  try {
    await sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: false,
        id: quoted,
        participant: participant
      }
    });
  } catch (err) {
    console.error('❌ Failed to delete message:', err);
    await sock.sendMessage(jid, { text: '❌ Could not delete the message. Make sure I have admin rights.' });
  }
}
