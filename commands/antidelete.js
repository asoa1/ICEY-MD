import { downloadMediaMessage } from '@whiskeysockets/baileys';

let OWNER_JID = null;
let enabled = true;
const ALERT_PREFIX = "🚨 *DELETED MESSAGE ALERT* 🚨";
let sockInstance = null;
const processedDeletions = new Set(); // Track processed deletions
const alertMessageIds = new Set(); // Track IDs of sent alerts

export const command = 'antidelete';

export async function handleAntiDelete(sock, messageCache) {
  sockInstance = sock;
  
  if (!messageCache) {
    console.error('[ANTIDELETE] ERROR: Invalid messageCache provided!');
    return;
  }
  
  console.log(`[ANTIDELETE] Handler registered with cache (${messageCache.size} items)`);
  
  sock.ev.on('messages.update', async (updates) => {
    if (!OWNER_JID || !enabled || !sockInstance) {
      console.log(`[ANTIDELETE] Skipping - ${!OWNER_JID ? 'owner not set' : !sockInstance ? 'no socket' : 'disabled'}`);
      return;
    }
    
    for (const update of updates) {
      try {
        if (!update.key || !update.key.id) {
          console.log('[ANTIDELETE] Skipping deletion without ID');
          continue;
        }
        
        const messageId = update.key.id;
        
        // Skip if we've already processed this deletion
        if (processedDeletions.has(messageId)) {
          console.log('[ANTIDELETE] Skipping already processed deletion:', messageId);
          continue;
        }
        processedDeletions.add(messageId);
        
        console.log('[ANTIDELETE] Processing deletion for:', messageId);
        
        // Skip our own alert messages
        if (alertMessageIds.has(messageId) || messageId.startsWith('BAILEYS_ALERT_')) {
          console.log('[ANTIDELETE] Skipping alert message deletion');
          alertMessageIds.delete(messageId);
          continue;
        }
        
        const original = messageCache.get(messageId);
        
        // Special handling for DMs when content isn't cached
        if (!original || !original.message) {
          console.log('[ANTIDELETE] Message not in cache:', messageId);
          
          const jid = update.key.remoteJid;
          const isDM = jid && jid.endsWith('@s.whatsapp.net');
          
          if (isDM) {
            // Only alert once per message to prevent spam
            if (!processedDeletions.has(`DM_ALERT_${messageId}`)) {
              processedDeletions.add(`DM_ALERT_${messageId}`);
              
              await sockInstance.sendMessage(OWNER_JID, {
                text: `${ALERT_PREFIX}\n\n💬 DM Message Deleted!\n🆔 ID: ${messageId}\n⚠️ Content not cached`
              });
            }
          }
          continue;
        }

        if (original.key.fromMe) {
          console.log('[ANTIDELETE] Skipping bot message deletion');
          continue;
        }

        const jid = original.key.remoteJid;
        const isDM = !jid.endsWith('@g.us');
        
        // Get sender and deleter information
        const senderJid = original.key.participant || jid;
        const deleterId = update.key.participant || (update.key.fromMe ? sock.user.id : 'unknown');
        
        const senderName = original.pushName || senderJid.split('@')[0];
        const deleterName = deleterId.split('@')[0];
        
        // Prepare report
        let report = `${ALERT_PREFIX}\n\n`;
        
        if (isDM) {
          report += `*DM Chat*: ${senderName}\n`;
        } else {
          let groupName = "Unknown Group";
          try {
            const groupMetadata = await sock.groupMetadata(jid);
            groupName = groupMetadata.subject || groupName;
          } catch (err) {
            console.error('[ANTIDELETE] Group metadata error:', err);
          }
          report += `*Group*: ${groupName}\n`;
        }
        
        report += `*Deleted by*: ${deleterName}\n`;
        report += `*Original sender*: ${senderName}\n`;
        
        // Handle message content and media
        let mediaContent = null;
        let mediaType = null;
        let mediaFileName = null;
        let textContent = '';
        
        if (original.message.conversation) {
          textContent = original.message.conversation;
        } else if (original.message.extendedTextMessage?.text) {
          textContent = original.message.extendedTextMessage.text;
        } else if (original.message.imageMessage) {
          mediaType = 'image';
          textContent = original.message.imageMessage.caption || '🖼️ Image Message';
          mediaFileName = 'deleted-image.jpg';
        } else if (original.message.videoMessage) {
          mediaType = 'video';
          textContent = original.message.videoMessage.caption || '🎬 Video Message';
          mediaFileName = 'deleted-video.mp4';
        } else if (original.message.documentMessage) {
          mediaType = 'document';
          mediaFileName = original.message.documentMessage.fileName || 'deleted-file';
          textContent = `📄 Document: ${mediaFileName}`;
        } else if (original.message.audioMessage) {
          mediaType = 'audio';
          textContent = '🔊 Audio Message';
          mediaFileName = 'deleted-audio.ogg';
        } else {
          textContent = '❌ Unsupported message type';
        }

        report += `*Content*: ${textContent}`;

        // Try to download media if available
        if (mediaType) {
          try {
            mediaContent = await downloadMediaMessage(original, 'buffer', {});
          } catch (mediaErr) {
            console.error('[ANTIDELETE] Failed to download media:', mediaErr);
            report += '\n⚠️ Could not retrieve media';
          }
        }

        // Generate unique ID for alert to prevent recursion
        const alertId = `BAILEYS_ALERT_${Date.now()}`;
        
        // Send alert with or without media
        let alertMessage;
        if (mediaContent && mediaType) {
          alertMessage = await sockInstance.sendMessage(OWNER_JID, {
            [mediaType]: mediaContent,
            fileName: mediaFileName,
            caption: report,
            contextInfo: {
              stanzaId: alertId
            }
          });
          console.log(`[ANTIDELETE] Sent ${mediaType} alert`);
        } else {
          alertMessage = await sockInstance.sendMessage(OWNER_JID, {
            text: report,
            contextInfo: {
              stanzaId: alertId
            }
          });
          console.log('[ANTIDELETE] Sent text alert');
        }
        
        // Track this alert message so we don't process its deletion
        if (alertMessage && alertMessage.key && alertMessage.key.id) {
          alertMessageIds.add(alertMessage.key.id);
        }
        
        // Clean up cache
        messageCache.delete(messageId);
        
      } catch (err) {
        console.error('[ANTIDELETE] Error in handler:', err);
      }
    }
  });
}

export const execute = async (sock, m, jid, messageCache) => {
  const isDM = jid.endsWith('@s.whatsapp.net');
  console.log(`[ANTIDELETE] Command received from: ${isDM ? 'DM' : 'Group'} ${jid}`);
  
  // Extract message text
  const msg = m.message;
  let text = '';
  if (msg.conversation) text = msg.conversation;
  else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
  
  // Set owner on first use
  if (!OWNER_JID) {
    OWNER_JID = m.key.participant || jid;
    console.log(`[ANTIDELETE] Owner set to: ${OWNER_JID}`);
    await sock.sendMessage(jid, { 
      text: `✅ Owner set to: ${OWNER_JID.split('@')[0]}\nAnti-delete notifications enabled!`
    });
    return;
  }

  // Toggle functionality
  if (text.includes('on') || text.includes('off')) {
    enabled = text.includes('on');
    const status = enabled ? 'enabled' : 'disabled';
    console.log(`[ANTIDELETE] Notifications ${status} by ${jid}`);
    await sock.sendMessage(jid, { text: `✅ Anti-delete notifications ${status}` });
  } 
  // Reset owner
  else if (text.includes('reset') && OWNER_JID === (m.key.participant || jid)) {
    OWNER_JID = null;
    enabled = true;
    processedDeletions.clear();
    alertMessageIds.clear();
    console.log(`[ANTIDELETE] Owner reset by ${jid}`);
    await sock.sendMessage(jid, { text: `🔄 Anti-delete owner reset. Use .antidelete again to set new owner.` });
  }
  // Status check
  else {
    await sock.sendMessage(jid, { 
      text: `🔧 Anti-Delete Settings:\n\n👑 Owner: ${OWNER_JID.split('@')[0]}\n🔔 Status: ${enabled ? 'ON' : 'OFF'}\n\nUse:\n.antidelete on - Enable\n.antidelete off - Disable\n.antidelete reset - Reset owner (current owner only)`
    });
  }
};