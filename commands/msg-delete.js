export const command = 'msg-delete';

const statusMap = new Map();

export const execute = async (sock, msg, jid) => {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    '';
  const arg = text.split(' ')[1]?.toLowerCase();

  if (!['on', 'off'].includes(arg)) {
    return sock.sendMessage(jid, { text: 'Usage: `.msg-delete on` or `.msg-delete off`', quoted: msg });
  }

  statusMap.set(jid, arg === 'on');
  const res = arg === 'on'
    ? '🛡️ Anti-Delete *Enabled*.'
    : '❌ Anti-Delete *Disabled*.';

  await sock.sendMessage(jid, { text: res, quoted: msg });
};

export const isEnabled = (jid) => statusMap.get(jid);
