export const command = 'antibot';

export const execute = async (sock, m, jid) => {
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) {
    return sock.sendMessage(jid, { text: '⚠️ This command only works in groups.' });
  }

  const option = m.message.conversation?.split(' ')[1];
  if (option === 'on') {
    antiBotGroups.add(jid);
    await sock.sendMessage(jid, { text: '✅ Anti-bot is now *enabled*. Only this bot can work in this group.' });
  } else if (option === 'off') {
    antiBotGroups.delete(jid);
    await sock.sendMessage(jid, { text: '❌ Anti-bot is now *disabled*. Other bots can now work.' });
  } else {
    await sock.sendMessage(jid, { text: 'ℹ️ Use `.antibot on` or `.antibot off`' });
  }
};
