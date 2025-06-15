export const command = 'queue';

const queue = [];

export async function execute(sock, m, jid) {
  const sender = m.key.participant || m.key.remoteJid;
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text;

  if (!text.includes('|')) {
    return await sock.sendMessage(jid, { text: '❌ Usage: `.queue | group name | message`' });
  }

  const [, groupName, ...messageParts] = text.split('|').map(v => v.trim());
  const messageText = messageParts.join(' ');

  const groups = await sock.groupFetchAllParticipating();
  const group = Object.values(groups).find(g => g.subject.toLowerCase() === groupName.toLowerCase());

  if (!group) {
    return await sock.sendMessage(jid, { text: `❌ Group "${groupName}" not found.` });
  }

  const groupId = group.id;

  // Check if group is locked (announcement mode)
  if (!group.announce) {
    await sock.sendMessage(groupId, { text: messageText });
    return await sock.sendMessage(jid, { text: `✅ Group was open. Message sent immediately.` });
  }

  // Store in queue
  queue.push({ groupId, messageText, scheduledBy: sender });

  await sock.sendMessage(jid, {
    text: `⏳ Group is locked. Message queued and will be sent once it's open.`
  });
}

// 👀 Monitor group metadata changes
export function monitor(sock) {
  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      if (!update.id || update.announce !== false) continue;

      const queuedMsgs = queue.filter(q => q.groupId === update.id);
      for (const q of queuedMsgs) {
        try {
          await sock.sendMessage(q.groupId, { text: q.messageText });
        } catch (e) {
          console.error('❌ Failed to send queued message:', e);
        }
      }

      // Remove sent messages
      for (const q of queuedMsgs) {
        const index = queue.indexOf(q);
        if (index > -1) queue.splice(index, 1);
      }
    }
  });
}
