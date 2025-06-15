// commands/group/add.js
import pkg from '@whiskeysockets/baileys';

export const command = 'add';
export const description = 'Add user to group by phone number';
export const category = 'group';
export const adminOnly = true;
export const usage = '<phone number with country code>';

export const execute = async (sock, m, jid) => {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const args = text.split(' ');
    const isGroup = jid.endsWith('@g.us');
    
    if (!isGroup) {
        return sock.sendMessage(jid, { text: '⚠️ This command only works in groups!' });
    }

    // Check if number is provided
    if (args.length < 2) {
        return sock.sendMessage(jid, { 
            text: '❌ Please provide a phone number\nExample: `.add 23412345678`' 
        });
    }

    const number = args[1];
    
    // Validate phone number format
    if (!/^\d{7,15}$/.test(number)) {
        return sock.sendMessage(jid, { 
            text: '❌ Invalid phone number format. Use country code + number without spaces\nExample: `23412345678`' 
        });
    }

    const targetJid = `${number}@s.whatsapp.net`;
    
    try {
        // Add user to group
        await sock.groupParticipantsUpdate(
            jid,
            [targetJid],
            'add'
        );
        
        return sock.sendMessage(jid, { 
            text: `✅ Successfully added ${number} to the group!`,
            mentions: [targetJid]
        });
        
    } catch (error) {
        console.error('Add command error:', error);
        let errorMessage = `❌ Failed to add ${number} to the group`;
        
        if (error.message.includes('not authorized')) {
            errorMessage = '⚠️ Bot needs to be admin to add members!';
        } else if (error.message.includes('403')) {
            errorMessage = `❌ ${number} has privacy settings that prevent adding`;
        } else if (error.message.includes('404')) {
            errorMessage = `❌ ${number} is not on WhatsApp`;
        } else if (error.message.includes('409')) {
            errorMessage = `❌ ${number} is already in the group`;
        }
        
        return sock.sendMessage(jid, { text: errorMessage });
    }
};