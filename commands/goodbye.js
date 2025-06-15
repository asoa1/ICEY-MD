export const command = 'goodbye';

export async function execute(sock, m, jid, _, goodbyeGroups) {
  const args = m.message?.conversation?.split(' ') || [];
  const option = args[1];

  if (!option || !['on', 'off'].includes(option)) {
    await sock.sendMessage(jid, { text: 'ℹ️ Use `.goodbye on` or `.goodbye off`' });
    return;
  }

  if (option === 'on') {
    goodbyeGroups.add(jid);
    await sock.sendMessage(jid, { text: '👋 Goodbye message *enabled* for this group!' });
  } else {
    goodbyeGroups.delete(jid);
    await sock.sendMessage(jid, { text: '❌ Goodbye message *disabled* for this group.' });
  }
}
