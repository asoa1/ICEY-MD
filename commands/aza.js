import fs from 'fs';
const azaFile = './aza.json';
export const command = 'aza';

export async function execute(sock, m, jid) {
  const data = fs.existsSync(azaFile) ? JSON.parse(fs.readFileSync(azaFile)) : {};
  const aza = data[m.key.participant || jid];

  if (!aza) {
    await sock.sendMessage(jid, {
      text: `❌ No bank details found!\nUse \`.setaza Holder Name | Bank Name | Account Number\` to set it.`
    });
  } else {
    await sock.sendMessage(jid, {
      text: `🏦 *BANK DETAILS*\n\n🚹 *${aza.holder.toUpperCase()}*\n🔢 *${aza.account}*\n🏦 *${aza.bank.toUpperCase()}*`
    });
  }

  await sock.sendMessage(jid, { react: { text: '💳', key: m.key } });
}
