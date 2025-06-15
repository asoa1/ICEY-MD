import fs from 'fs';
import path from 'path';

export const command = 'menu';

export const execute = async (sock, m, jid) => {
  try {
    const imagePath = path.join(process.cwd(), 'media', 'icey_md_menu.jpg');

    if (!fs.existsSync(imagePath)) {
      await sock.sendMessage(jid, { text: '❌ Menu image not found. Please place icey_md_menu.jpg inside /media folder.' });
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const userName = sock.user?.name || 'ICEY';
    const mode = global.botMode || 'public';

    const caption = `
❄️ *ICEY-MD COMMAND MENU* ❄️
━━━━━━━━━━━━━━━━━━━━━━━

👾 *BOT INFORMATION*
╭──────────────────────────────╮
│ • 🔹 *.icey* – Bot details & version  
│ • 📊 *.stats* – Bot usage stats  
│ • ⏱️ *.uptime* – How long bot has been running  
│ • 🔐 *.mode [public/private]* – Switch bot mode (Owner only)  
╰──────────────────────────────╯

🎞️ *MEDIA CONVERSION TOOLS*
╭──────────────────────────────╮
│ • 🎥 *.tovid* – Sticker ➜ Video  
│ • 🖼️ *.toimg* – Sticker ➜ Image  
│ • 🌀 *.tosticker* – Image/Video ➜ Sticker  
│ • 👁️‍🗨️ *.vv* – Reveal view-once media  
│ • 🖌️ *.setpp* – Set group pic (Admin)  
╰──────────────────────────────╯

👥 *GROUP MANAGEMENT*
╭──────────────────────────────╮
│ • 🆕 *.gc-create [name]* – Make group  
│ • ❌ *.gc-delete [name]* – Delete group  
│ • 🔼 *.promote @user* – Promote to admin  
│ • 🦵 *.kick @user* – Remove user  
│ • 📢 *.tagall* – Mention everyone  
│ • 🔇 *.hidetag [msg]* – Silent tag  
│ • 📜 *.rules* – Show group rules  
│ • 🎉 *.welcome on/off* – Welcome toggle  
│ • 😢 *.goodbye on/off* – Goodbye toggle  
╰──────────────────────────────╯

🎉 *FUN & ENTERTAINMENT*
╭──────────────────────────────╮
│ • 😍 *.flirt* – Romantic line  
│ • 😂 *.joke* – Random joke  
│ • 🎯 *.truth* – Truth question  
│ • 💬 *.quote* – Motivation  
│ • 🗳️ *.vote [q]* – Poll creation  
│ • 😎 *.emoji [name]* – Search emoji  
│ • 🧬 *.level* – XP Level  
╰──────────────────────────────╯

🛠️ *UTILITY TOOLS*
╭──────────────────────────────╮
│ • ▶️ *.play [song]* – Play YT song  
│ • 👤 *.getpp @user* – Get profile pic  
│ • 📬 *.queue |group|msg|* – Queue for locked group  
│ • 🏓 *.ping* – Response test  
╰──────────────────────────────╯

🧹 *MESSAGE MANAGEMENT*
╭──────────────────────────────╮
│ • 🗑️ *.msg-delete on/off* – Anti-delete toggle  
│ • 🔄 Recovers deleted messages  
╰──────────────────────────────╯

💳 *FINANCIAL COMMANDS*
╭──────────────────────────────╮
│ • 🏦 *.setaza Name | Bank | Acc* – Save account  
╰──────────────────────────────╯

💫 *SPECIAL FEATURES*
╭──────────────────────────────╮
✔️ Auto Message Queue  
✔️ View-Once Revealer  
✔️ XP Rank System  
✔️ 200+ Emojis Database  
╰──────────────────────────────╯

📌 *Prefix:* [.]
🔧 *Framework:* Baileys-MD  
💻 *Version:* 2.0.0 Beta  
👤 *Dev:* @anonymous

💡 *Tip:* Use *.menu* anytime  
⚠️ *Note:* [] = required | = separator
    `;

    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption
    }, { quoted: m });

    await sock.sendMessage(jid, { react: { text: '❄️', key: m.key } });

  } catch (err) {
    console.error('❌ .menu command error:', err);
    await sock.sendMessage(jid, { text: '❌ Failed to show menu.' });
  }
};
