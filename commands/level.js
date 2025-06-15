import fs from 'fs';
const dbPath = './level.json';

export const command = 'level';
export const execute = async (sock, m, jid) => {
  const sender = m.key.participant || m.key.remoteJid;
  let db = {};

  if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath));

  if (!db[sender]) db[sender] = { xp: 0, level: 1 };
  db[sender].xp += 10;

  const level = Math.floor(db[sender].xp / 100) + 1;
  db[sender].level = level;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  await sock.sendMessage(jid, {
    text: `🏅 @${sender.split('@')[0]}, you're at *Level ${level}* with ${db[sender].xp} XP!`,
    mentions: [sender]
  });
};
