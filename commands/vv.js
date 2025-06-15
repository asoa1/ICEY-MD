import { downloadMediaMessage } from '@whiskeysockets/baileys';
export const command = 'vv';

export async function execute(sock, msg) {
  try {
    const jid = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo;

    if (!quoted?.quotedMessage) {
      return sock.sendMessage(jid, {
        text: '❗ Reply to a view-once image or video using `.vv`.',
        quoted: msg,
      });
    }

    const v1 = quoted.quotedMessage.viewOnceMessage;
    const raw = v1?.message || quoted.quotedMessage; // fallback if viewOnceMessage is null

    const key = Object.keys(raw)[0];

    if (key !== 'imageMessage' && key !== 'videoMessage') {
      return sock.sendMessage(jid, {
        text: '❌ Unsupported media type. Only view-once image or video allowed.',
        quoted: msg,
      });
    }

    const media = raw[key];
    const buffer = await downloadMediaMessage(
        { message: { [key]: media } },
        'buffer'
      );
      
    await sock.sendMessage(jid, {
      [key === 'imageMessage' ? 'image' : 'video']: buffer,
      caption: '🔁 Re-sent view-once media',
    });
  } catch (err) {
    console.error('❌ VV command error:', err);
    return sock.sendMessage(msg.key.remoteJid, {
      text: '⚠️ Could not retrieve view-once media.',
      quoted: msg,
    });
  }
}
