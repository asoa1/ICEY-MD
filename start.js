const antiBotGroups = new Set();
const welcomeGroups = new Set();
const goodbyeGroups = new Set();
const bannedUsers = new Set();
const antiLinkGroups = new Set();

import pkg from '@whiskeysockets/baileys';
const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = pkg;

import { handleAntiDelete } from './commands/antidelete.js';
import { Boom } from '@hapi/boom';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const commands = new Map();
let msgDeleteEnabled = true;
const messageCache = new Map();

global.totalMessages = 0;
global.botMode = 'public';

// Enhanced cache cleaning with deletion tracking
function autoCleanCache(interval = 5 * 60 * 1000) {
  setInterval(() => {
    const now = Date.now();
    const expiryTime = 5 * 60 * 1000;

    // Clean message cache
    for (const [key, message] of messageCache.entries()) {
      const messageTimestampSec = message.messageTimestamp || (message.key && message.key.timestamp);
      const messageTimestamp = messageTimestampSec ? messageTimestampSec * 1000 : now;

      if (now - messageTimestamp > expiryTime) {
        messageCache.delete(key);
      }
    }

    console.log(chalk.gray(`🧹 Cache cleaned | Messages: ${messageCache.size}`));
  }, interval);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '22.04'],
    shouldIgnoreJid: () => false
  });

  // Initialize anti-delete with required parameters
  handleAntiDelete(sock, messageCache);

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    const number = await ask('📱 Enter your number with country code: ');
    const code = await sock.requestPairingCode(number.trim());
    console.log(chalk.magenta('🔑 Pairing Code:'), chalk.bold(code));
  }

  // Load commands
  for (let file of fs.readdirSync(path.join(__dirname, 'commands'))) {
    if (file.endsWith('.js')) {
      const cmdModule = await import(`./commands/${file}`);
      
      if (cmdModule.command && cmdModule.execute) {
        commands.set(cmdModule.command, cmdModule.execute);
        console.log(`✅ Loaded command: .${cmdModule.command}`);
      }
      
      if (cmdModule.monitor) {
        cmdModule.monitor(sock);
      }
    }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(chalk.green('✅ Bot connected!'));

      const welcomeText = `✨ *WELCOME TO ICEY-MD* ✨\n\n👋 Hello, *ICEY-MD User*!`;
      const welcomeImagePath = path.join(__dirname, 'media', 'icey_md_menu.jpg');
      
      try {
        await sock.sendMessage(sock.user.id, {
          image: fs.readFileSync(welcomeImagePath),
          caption: welcomeText
        });
      } catch (e) {
        console.error('Failed to send welcome message:', e);
      }

      rl.close();
    }
    
    if (connection === 'close') {
      const rc = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (rc !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('⚠️ Reconnecting...'));
        startBot();
      } else {
        console.log(chalk.red('❌ Logged out.'));
      }
    }
  });

  // Group participants update handler
  sock.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
  
    for (const participant of participants) {
      try {
        const metadata = await sock.groupMetadata(id);
        const groupName = metadata.subject;
        const members = metadata.participants.length;
  
        const profilePicture = await sock.profilePictureUrl(participant, 'image').catch(() => null);
        const name = participant.split('@')[0];
  
        const time = new Date().toLocaleTimeString('en-NG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
  
        if (action === 'add' && welcomeGroups.has(id)) {
          await sock.sendMessage(id, {
            image: profilePicture ? { url: profilePicture } : fs.readFileSync('./media/welcome.jpg'),
            caption: `🎉 *Welcome, @${name}!* 🎉\n📍 You joined *${groupName}*\n👥 Member: ${members}\n🕓 Time: ${time}`,
            mentions: [participant]
          });
        } else if (action === 'remove' && goodbyeGroups.has(id)) {
          await sock.sendMessage(id, {
            image: profilePicture ? { url: profilePicture } : fs.readFileSync('./media/goodbye.jpg'),
            caption: `👋 @${name} has left *${groupName}*.\n👥 Members left: ${members}\n🕓 Time: ${time}`,
            mentions: [participant]
          });
        }
      } catch (err) {
        console.error('❌ Error in welcome/goodbye message:', err);
      }
    }
  });

  // Message processing handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) {
      try {
        if (!m.message) continue;
        
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        // Skip processing our own alert messages
        if (m.key.fromMe) {
          let text = '';
          if (m.message.conversation) text = m.message.conversation;
          else if (m.message.extendedTextMessage?.text) text = m.message.extendedTextMessage.text;
          else if (m.message.imageMessage?.caption) text = m.message.imageMessage.caption;
          else if (m.message.videoMessage?.caption) text = m.message.videoMessage.caption;
          else if (m.message.documentMessage?.caption) text = m.message.documentMessage.caption;

          if (text.includes('🚨 *DELETED MESSAGE ALERT* 🚨')) {
            console.log('💾 Skipping cache for alert message');
            continue;
          }
        }

        // Cache the message
        messageCache.set(m.key.id, {
          key: m.key,
          message: m.message,
          messageTimestamp: m.messageTimestamp,
          pushName: m.pushName
        });
        
        global.totalMessages++;

        // Extract message text
        const msg = m.message;
        let text = '';
        if (msg.conversation) text = msg.conversation;
        else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
        else if (msg.imageMessage?.caption) text = msg.imageMessage.caption;
        else if (msg.videoMessage?.caption) text = msg.videoMessage.caption;
        else if (msg.documentMessage?.caption) text = msg.documentMessage.caption;

        console.log(chalk.cyan(`📥 ${isGroup ? 'Group' : 'DM'} Message: ${text}`));

        // Check if sender is banned
        if (bannedUsers.has(sender) && text.startsWith('.')) {
          await sock.sendMessage(jid, { text: '🚫 You are banned from using this bot.' });
          continue;
        }

        // Anti-link protection
        if (isGroup && antiLinkGroups.has(jid)) {
          const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
          if (urlRegex.test(text)) {
            try {
              await sock.sendMessage(jid, { text: '🚫 Links are not allowed in this group. Message deleted!' });
              await sock.sendMessage(jid, {
                delete: {
                  remoteJid: jid,
                  fromMe: false,
                  id: m.key.id,
                  participant: sender
                }
              });
            } catch (e) {
              console.error('Failed to delete link message:', e);
            }
            continue;
          }
        }

        // Anti-bot protection
        if (isGroup && antiBotGroups.has(jid) && sender !== sock.user.id) {
          const isBot = (sender.includes('bot') || 
                         (m.pushName?.toLowerCase()?.includes('bot')) ||
                         text.startsWith('!'));
          
          if (isBot) {
            try {
              await sock.sendMessage(jid, {
                delete: {
                  remoteJid: jid,
                  fromMe: false,
                  id: m.key.id,
                  participant: sender
                }
              });
              console.log(`🚫 AntiBot deleted message from ${sender} in ${jid}`);
            } catch (err) {
              console.error('❌ Failed to delete bot message:', err);
            }
            continue;
          }
        }

        // Skip non-command messages
        if (!text.startsWith('.')) continue;

        const cmdName = text.slice(1).split(' ')[0].toLowerCase();
        
        // Existing commands
        if (cmdName === 'msg-delete') {
          const option = text.split(' ')[1];
          if (option === 'on') {
            msgDeleteEnabled = true;
            await sock.sendMessage(jid, { text: '✅ Anti-delete is now ON.' });
          } else if (option === 'off') {
            msgDeleteEnabled = false;
            await sock.sendMessage(jid, { text: '🚫 Anti-delete is now OFF.' });
          } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Use `.msg-delete on` or `.msg-delete off`' });
          }
          continue;
        }

        if (cmdName === 'welcome') {
          if (!isGroup) {
            await sock.sendMessage(jid, { text: '⚠️ The .welcome command works only in groups.' });
            continue;
          }
          const option = text.split(' ')[1];
          if (option === 'on') {
            welcomeGroups.add(jid);
            await sock.sendMessage(jid, { text: '✅ Welcome messages are now *ON* for this group.' });
          } else if (option === 'off') {
            welcomeGroups.delete(jid);
            await sock.sendMessage(jid, { text: '🚫 Welcome messages are now *OFF* for this group.' });
          } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Use `.welcome on` or `.welcome off`' });
          }
          continue;
        }
        
        if (cmdName === 'goodbye') {
          if (!isGroup) {
            await sock.sendMessage(jid, { text: '⚠️ The .goodbye command works only in groups.' });
            continue;
          }
          const option = text.split(' ')[1];
          if (option === 'on') {
            goodbyeGroups.add(jid);
            await sock.sendMessage(jid, { text: '✅ Goodbye messages are now *ON* for this group.' });
          } else if (option === 'off') {
            goodbyeGroups.delete(jid);
            await sock.sendMessage(jid, { text: '🚫 Goodbye messages are now *OFF* for this group.' });
          } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Use `.goodbye on` or `.goodbye off`' });
          }
          continue;
        }
        
        if (cmdName === 'update') {
          await sock.sendMessage(jid, { text: '🔄 Updating...' });
          exec('git pull', (err, stdout, stderr) => {
            console.log(chalk.gray('Git Output:\n'), stdout || stderr);
            setTimeout(() => process.exit(0), 1500);
          });
          continue;
        }

        // New commands
        if (cmdName === 'anti-link') {
          if (!isGroup) {
            await sock.sendMessage(jid, { text: '⚠️ The .anti-link command works only in groups.' });
            continue;
          }
          const option = text.split(' ')[1];
          if (option === 'on') {
            antiLinkGroups.add(jid);
            await sock.sendMessage(jid, { text: '✅ Anti-link is now *ON* for this group.' });
          } else if (option === 'off') {
            antiLinkGroups.delete(jid);
            await sock.sendMessage(jid, { text: '🚫 Anti-link is now *OFF* for this group.' });
          } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Use `.anti-link on` or `.anti-link off`' });
          }
          continue;
        }
        
        if (cmdName === 'antibot') {
          if (!isGroup) {
            await sock.sendMessage(jid, { text: '⚠️ The .antibot command only works in groups.' });
            continue;
          }
          const option = text.split(' ')[1];
          if (option === 'on') {
            antiBotGroups.add(jid);
            await sock.sendMessage(jid, { text: '✅ Anti-bot is now *enabled*. Only this bot will respond in this group.' });
          } else if (option === 'off') {
            antiBotGroups.delete(jid);
            await sock.sendMessage(jid, { text: '❌ Anti-bot is now *disabled*. Other bots can now respond too.' });
          } else {
            await sock.sendMessage(jid, { text: 'ℹ️ Use `.antibot on` or `.antibot off`' });
          }
          continue;
        }
        
        if (cmdName === 'ban') {
          if (!text.includes('@')) {
            await sock.sendMessage(jid, { text: '❗ Please tag the user to ban: `.ban @user`' });
            continue;
          }
          const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
          if (mentions.length === 0) {
            await sock.sendMessage(jid, { text: '❗ No user mentioned to ban.' });
            continue;
          }
          for (const userId of mentions) {
            bannedUsers.add(userId);
          }
          await sock.sendMessage(jid, { 
            text: `🚫 Banned user(s): ${mentions.map(u => '@' + u.split('@')[0]).join(', ')}`, 
            mentions: mentions 
          });
          continue;
        }

        if (cmdName === 'unban') {
          if (!text.includes('@')) {
            await sock.sendMessage(jid, { text: '❗ Please tag the user to unban: `.unban @user`' });
            continue;
          }
          const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
          if (mentions.length === 0) {
            await sock.sendMessage(jid, { text: '❗ No user mentioned to unban.' });
            continue;
          }
          for (const userId of mentions) {
            bannedUsers.delete(userId);
          }
          await sock.sendMessage(jid, { 
            text: `✅ Unbanned user(s): ${mentions.map(u => '@' + u.split('@')[0]).join(', ')}`, 
            mentions: mentions 
          });
          continue;
        }

        if (cmdName === 'blocklist') {
          if (bannedUsers.size === 0) {
            await sock.sendMessage(jid, { text: '✅ No banned users.' });
          } else {
            const listText = Array.from(bannedUsers).map(u => '@' + u.split('@')[0]).join('\n');
            await sock.sendMessage(jid, { 
              text: `🚫 Banned users:\n${listText}`, 
              mentions: Array.from(bannedUsers) 
            });
          }
          continue;
        }

        // Execute other commands
        if (commands.has(cmdName)) {
          try {
            await commands.get(cmdName)(sock, m, jid, messageCache);
          } catch (e) {
            console.error('❌ Command error:', e);
            await sock.sendMessage(jid, { text: '❌ Command failed.' });
          }
        } else {
          await sock.sendMessage(jid, { text: `❓ Unknown command: .${cmdName}` });
        }
        
      } catch (err) {
        console.error('Error processing message:', err);
      }
    }
  });

  // Start auto-clean
  autoCleanCache();
}

startBot();
