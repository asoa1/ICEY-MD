export const command = 'uptime';

export async function execute(sock, m, jid) {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

  await sock.sendMessage(jid, { text: `⏳ Bot Uptime: ${uptimeString}` });
}
