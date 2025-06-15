export const command = 'icey';

export const execute = async (sock, m, jid) => {
  try {
    const userName = sock.user?.name || 'ICEY';
    const mode = global.botMode || 'public';

    const info = `
╔═════════════╗
║ ❄️ *ICEY-MD BOT INFO* ❄️
╚═════════════╝

👤 *Owner*     : ${userName}
📦 *Library*   : Baileys MD
🚦 *Mode*      : ${mode}
🔖 *Prefix*    : .
📌 *Version*   : 2.0.0 Beta
💻 *Framework* : Node.js
🧠 *Commands*  : Auto Queue, Group Tools, Fake Typing, Bank Info & more

🔧 *Dev*       : @anonymous

💡 Use *.menu* to explore commands.
    `;

    await sock.sendMessage(jid, {
      text: info
    }, { quoted: m });

    await sock.sendMessage(jid, {
      react: { text: '❄️', key: m.key }
    });

  } catch (err) {
    console.error('❌ .icey command error:', err);
    await sock.sendMessage(jid, { text: '❌ Failed to show ICEY-MD info.' });
  }
};
