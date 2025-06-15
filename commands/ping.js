export const command = 'ping';

export const execute = async (sock, msg, jid) => {
  await sock.sendMessage(jid, { react: { text: '🕒', key: msg.key } });

  await sock.presenceSubscribe(jid);
  await sock.sendPresenceUpdate('composing', jid);

  const start = performance.now();
  await new Promise(res => setTimeout(res, 500));
  const end = performance.now();

  const speed = (end - start).toFixed(2);
  const out = `\`\`\`🚀 ICEY-MD Ping\`\`\`\nSpeed: *${speed}ms* 🔥`;

  await sock.sendMessage(jid, { text: out, quoted: msg });
};
