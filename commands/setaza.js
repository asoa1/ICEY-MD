import fs from 'fs';
const azaFile = './aza.json';
export const command = 'setaza';

export async function execute(sock, m, jid) {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const args = text.replace('.setaza', '').trim().split('|');

  if (args.length !== 3) {
    await sock.sendMessage(jid, {
      text: `❌ *Missing Bank Info!*\n\nPlease use the correct format to set your bank details:\n\n\`.setaza Holder Name | Bank Name | Account Number\`\n\nExample:\n\`.setaza John Doe | First Bank | 1234567890\``
    });
    await sock.sendMessage(jid, { react: { text: '💳', key: m.key } });
    return;
  }

  const [holder, bank, account] = args.map((x) => x.trim());

  const data = fs.existsSync(azaFile) ? JSON.parse(fs.readFileSync(azaFile)) : {};
  data[m.key.participant || jid] = { holder, bank, account };
  fs.writeFileSync(azaFile, JSON.stringify(data, null, 2));

  await sock.sendMessage(jid, {
    text: `✅ *Bank Info Saved!*\n\n🏦 *BANK DETAILS*\n\n🚹 *${holder.toUpperCase()}*\n🔢 *${account}*\n🏦 *${bank.toUpperCase()}*`
  });

  await sock.sendMessage(jid, { react: { text: '💳', key: m.key } });
}
