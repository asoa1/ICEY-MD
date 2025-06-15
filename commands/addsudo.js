import fs from 'fs';
const sudoFile = './sudo.json';

export const command = 'addsudo';
export const execute = async (sock, m, jid) => {
  const sender = m.key.participant || m.key.remoteJid;

  // 🛠 Create the file if it doesn't exist
  if (!fs.existsSync(sudoFile)) {
    fs.writeFileSync(sudoFile, JSON.stringify([sender], null, 2));
  }

  const sudoList = JSON.parse(fs.readFileSync(sudoFile));

  if (!sudoList.includes(sender)) {
    return sock.sendMessage(jid, { text: '❌ Only existing sudo users can add others.' });
  }

  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentioned || mentioned.length === 0) {
    return sock.sendMessage(jid, { text: '📌 Please tag the user you want to add as sudo.' });
  }

  const target = mentioned[0];
  if (sudoList.includes(target)) {
    return sock.sendMessage(jid, { text: '✅ This user is already a sudo.' });
  }

  sudoList.push(target);
  fs.writeFileSync(sudoFile, JSON.stringify(sudoList, null, 2));
  await sock.sendMessage(jid, { text: `✅ Added @${target.split('@')[0]} as sudo.`, mentions: [target] });
};
