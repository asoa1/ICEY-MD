import fs from 'fs';
const sudoFile = './sudo.json';

export const command = 'delsudo';
export const execute = async (sock, m, jid) => {
  const sender = m.key.participant || m.key.remoteJid;

  if (!fs.existsSync(sudoFile)) {
    fs.writeFileSync(sudoFile, JSON.stringify([sender], null, 2));
  }

  const sudoList = JSON.parse(fs.readFileSync(sudoFile));

  if (!sudoList.includes(sender)) {
    return sock.sendMessage(jid, { text: '❌ Only sudo users can remove other sudos.' });
  }

  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentioned || mentioned.length === 0) {
    return sock.sendMessage(jid, { text: '📌 Please tag the sudo user you want to remove.' });
  }

  const target = mentioned[0];

  // 🛡 Prevent removing the first sudo
  if (target === sudoList[0]) {
    return sock.sendMessage(jid, { text: '🛡️ You cannot remove the main bot owner (first sudo).' });
  }

  if (!sudoList.includes(target)) {
    return sock.sendMessage(jid, { text: '🚫 This user is not a sudo.' });
  }

  const updatedList = sudoList.filter(id => id !== target);
  fs.writeFileSync(sudoFile, JSON.stringify(updatedList, null, 2));
  await sock.sendMessage(jid, { text: `✅ Removed @${target.split('@')[0]} from sudo.`, mentions: [target] });
};
