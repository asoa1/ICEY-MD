import pkg from '@whiskeysockets/baileys';

export const command = 'invite';
export const description = 'Send group invite link to a phone number';
export const category = 'group';
export const adminOnly = true;
export const usage = '<phone number with country code>';

export const execute = async (sock, m, jid) => {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const isGroup = jid.endsWith('@g.us');
    
    if (!isGroup) {
        return sock.sendMessage(jid, { text: '⚠️ This command only works in groups!' });
    }

    try {
        // Extract phone number from command
        const number = text.split(' ')[1];
        
        if (!number) {
            return sock.sendMessage(jid, { 
                text: '❌ Please specify a phone number\nExample: `.invite 23412345678`' 
            });
        }

        // Validate phone number format
        if (!/^\d{7,15}$/.test(number)) {
            return sock.sendMessage(jid, { 
                text: '❌ Invalid phone number format. Use country code + number without spaces\nExample: `23412345678`' 
            });
        }

        // Generate invite link
        const inviteCode = await sock.groupInviteCode(jid);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        const targetJid = `${number}@s.whatsapp.net`;

        try {
            // Send invite directly to the user
            await sock.sendMessage(targetJid, {
                text: `📬 *You're invited to join a group!*\n\n` +
                      `🔗 *Invite Link:* ${inviteLink}\n` +
                      `📌 *Sent by:* @${m.key.participant?.split('@')[0] || 'Group Admin'}\n\n` +
                      `_Tap the link to join the group!_`,
                mentions: [m.key.participant]
            });
            
            return sock.sendMessage(jid, { 
                text: `✅ Invite sent successfully to ${number}`
            });
            
        } catch (sendError) {
            console.error('Invite send error:', sendError);
            let errorMessage = `❌ Failed to send invite to ${number}`;
            
            if (sendError.message.includes('404')) {
                errorMessage = `❌ ${number} is not on WhatsApp`;
            } else if (sendError.message.includes('401')) {
                errorMessage = `❌ ${number} has blocked the bot`;
            }
            
            return sock.sendMessage(jid, { text: errorMessage });
        }

    } catch (error) {
        console.error('Invite command error:', error);
        let errorMessage = '❌ Failed to generate invite';
        
        if (error.message.includes('401')) {
            errorMessage = '⚠️ Bot needs to be admin to create invite links!';
        }
        
        return sock.sendMessage(jid, { text: errorMessage });
    }
};