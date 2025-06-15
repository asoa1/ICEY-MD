export const command = 'gc-delete';
export async function execute(sock, m, jid) {
  const raw = m.message.conversation || m.message.extendedTextMessage?.text || '';
  const groupName = raw.slice('.gc-delete'.length).trim();
  if (!groupName) {
    return sock.sendMessage(jid, {
      text: '❗ Usage: `.gc-delete Your Group Name`',
      quoted: m
    });
  }

  try {
    const groups = await sock.groupFetchAllParticipating();
    const group = Object.values(groups).find(g =>
      g.subject.toLowerCase() === groupName.toLowerCase()
    );
    if (!group) {
      return sock.sendMessage(jid, {
        text: `❌ Group "${groupName}" not found.`,
        quoted: m
      });
    }

    const groupId = group.id;
    const meta = await sock.groupMetadata(groupId);

    const botJid = sock.user.jid;
    const botParticipant = meta.participants.find(p => p.id === botJid);

    if (!botParticipant?.admin) {
      return sock.sendMessage(jid, {
        text: '🚫 I need to be *group admin* to delete this group.',
        quoted: m
      });
    }

    await sock.groupLeave(groupId);
    await sock.groupDelete(groupId);

    await sock.sendMessage(jid, {
      text: `✅ Group "${meta.subject}" has been deleted.`,
      quoted: m
    });

  } catch (err) {
    console.error('❌ gc-delete error:', err);
    await sock.sendMessage(jid, {
      text: '❌ Failed to delete group.',
      quoted: m
    });
  }
}
