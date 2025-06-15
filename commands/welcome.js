export const command = 'welcome';

export async function execute(sock, m, jid, _, welcomeGroups) {
  const args = m.message?.conversation?.split(' ') || [];
  const option = args[1];

  if (!option || !['on', 'off'].includes(option)) {
    await sock.sendMessage(jid, { text: 'ℹ️ Use `.welcome on` or `.welcome off`' });
    return;
  }

  if (option === 'on') {
    welcomeGroups.add(jid);
    await sock.sendMessage(jid, { text: '✅ Welcome message *enabled* for this group!' });
  } else {
    welcomeGroups.delete(jid);
    await sock.sendMessage(jid, { text: '❌ Welcome message *disabled* for this group.' });
  }
}
