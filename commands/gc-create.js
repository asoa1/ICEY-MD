export const command = 'gc-create';

export async function execute(sock, m, jid) {
  const msg = m.message;
  let text = '';

  if (msg.conversation) text = msg.conversation;
  else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
  else return;

  const groupName = text.slice('.gc-create'.length).trim();

  if (!groupName) {
    await sock.sendMessage(jid, { text: '❗ Please provide a group name.\nExample: `.gc-create My Group`' });
    return;
  }

  try {
    const participants = [m.key.participant || m.key.remoteJid];
    const { id: groupId } = await sock.groupCreate(groupName, participants);

    await sock.sendMessage(jid, { text: `✅ Group "${groupName}" created!\n📎 Group ID: ${groupId}` });
  } catch (err) {
    console.error('❌ Group creation error:', err);
    await sock.sendMessage(jid, { text: '❌ Failed to create group. Make sure your number is not restricted.' });
  }
}
