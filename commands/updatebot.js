import { performUpdate, setUpdateOwner, getUpdateInfo, checkForUpdates } from './updateSystem.js';
import { spawn } from 'child_process';

export const command = 'updatebot';
export const aliases = ['updateinfo', 'setowner'];

export const execute = async (sock, m, jid) => {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const cmd = text.split(' ')[0].slice(1).toLowerCase();
  
  if (cmd === 'setowner') {
    if (text.includes('@')) {
      const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length > 0) {
        setUpdateOwner(mentions[0]);
        await sock.sendMessage(jid, { 
          text: `👑 Update owner set to: @${mentions[0].split('@')[0]}`,
          mentions: [mentions[0]]
        });
      } else {
        await sock.sendMessage(jid, { text: '❗ Please mention a user' });
      }
    } else {
      const newOwner = m.key.participant || jid;
      setUpdateOwner(newOwner);
      await sock.sendMessage(jid, { 
        text: `👑 Update owner set to: @${newOwner.split('@')[0]}`,
        mentions: [newOwner]
      });
    }
    return;
  }

  if (cmd === 'updateinfo') {
    const { updateAvailable, updateMessage } = getUpdateInfo();
    if (updateAvailable) {
      await sock.sendMessage(jid, { text: updateMessage });
    } else {
      // Force a check
      const hasUpdate = await checkForUpdates(sock);
      if (hasUpdate) {
        const { updateMessage } = getUpdateInfo();
        await sock.sendMessage(jid, { text: updateMessage });
      } else {
        await sock.sendMessage(jid, { text: '✅ Your bot is up-to-date!' });
      }
    }
    return;
  }

  if (cmd === 'updatebot') {
    const success = await performUpdate(sock, jid);
    if (success) {
      // Schedule restart
      setTimeout(() => {
        try {
          const args = [process.argv[1], ...process.execArgv];
          const child = spawn(process.argv[0], args, {
            detached: true,
            stdio: 'inherit',
            windowsHide: true
          });
          child.unref();
          process.exit(0);
        } catch (restartErr) {
          console.error('Restart failed:', restartErr);
          sock.sendMessage(jid, { text: '❌ Restart failed! Please restart manually.' });
        }
      }, 3000);
    }
  }
};