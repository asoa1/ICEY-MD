export const command = 'stats';

let totalMessages = 0; // We'll increment this from the main file

export async function execute(sock, m, jid) {
  // You can pass these values from main file or maintain here
  const mode = global.botMode || 'public'; // example, set in main file
  const uptimeSeconds = process.uptime();
  const uptime = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);

  await sock.sendMessage(jid, {
    text: `📊 *Bot Statistics*\n\n` +
          `🕒 Uptime: ${uptime}\n` +
          `💬 Total Messages: ${totalMessages}\n` +
          `🚦 Mode: ${mode}\n` +
          `🔖 Prefix: [ . ]\n` +
          `💻 Library: Baileys MD\n` +
          `🤖 Bot Name: ICEY-MD\n`
  });
}
