import { execSync } from 'child_process';
import fetch from 'node-fetch';
import { spawn } from 'child_process';

const REPO_OWNER = 'asoa1';
const REPO_NAME = 'ICEY-MD';
let updateAvailable = false;
let updateMessage = '';
let updateCheckInterval;
let ownerJID = null;

export async function checkForUpdates(sock) {
  try {
    console.log('🔍 Checking for updates...');
    
    // Get local commit hash
    const localHash = execSync('git rev-parse HEAD').toString().trim();
    
    // Get latest commit from GitHub API
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const remoteHash = data.sha;
    
    if (localHash !== remoteHash) {
      updateAvailable = true;
      updateMessage = `🚀 *Update Available!*\n\n` +
                     `🔹 New commit: ${remoteHash.slice(0, 7)}\n` +
                     `🔹 Message: ${data.commit.message.split('\n')[0]}\n` +
                     `🔹 Date: ${new Date(data.commit.committer.date).toLocaleString()}\n\n` +
                     `Use \`.updatebot\` to update now!`;
      
      console.log('✅ Update available!');
      
      // Notify owner if set
      if (ownerJID) {
        try {
          await sock.sendMessage(ownerJID, { text: updateMessage });
        } catch (notifyErr) {
          console.error('Failed to notify owner:', notifyErr);
        }
      }
    } else {
      updateAvailable = false;
      console.log('✅ Bot is up-to-date');
    }
    
    return updateAvailable;
  } catch (error) {
    console.error('Update check error:', error);
    return false;
  }
}

export function startUpdateChecks(sock, initialOwnerJID) {
  if (!initialOwnerJID) {
    console.error('❌ Cannot start update checks: owner JID not provided');
    return;
  }
  
  ownerJID = initialOwnerJID;
  console.log(`👑 Update system owner: ${ownerJID}`);
  
  // Don't start checks if sock is not available
  if (!sock) {
    console.log('⏳ Deferring update checks until sock is available');
    return;
  }
  
  // Start periodic update checks (every 6 hours)
  updateCheckInterval = setInterval(() => {
    try {
      checkForUpdates(sock);
    } catch (e) {
      console.error('Update check failed:', e);
    }
  }, 6 * 60 * 60 * 1000);
  
  // Initial check after 30 seconds
  setTimeout(() => {
    try {
      checkForUpdates(sock);
    } catch (e) {
      console.error('Initial update check failed:', e);
    }
  }, 30000);
}

export function setUpdateOwner(newOwner) {
  ownerJID = newOwner;
  console.log(`👑 Update owner changed to: ${ownerJID}`);
}

export function getUpdateInfo() {
  return {
    updateAvailable,
    updateMessage
  };
}

export async function performUpdate(sock, jid) {
  try {
    await sock.sendMessage(jid, { text: '🔄 Performing force update from GitHub...' });

    // 1. Fetch latest changes
    execSync('git fetch origin main');
    
    // 2. Reset to remote main branch
    execSync('git reset --hard origin/main');
    
    // 3. Clean any untracked files
    execSync('git clean -fd');
    
    const status = execSync('git status').toString();
    console.log('Git Status:\n', status);
    
    await sock.sendMessage(jid, { text: `✅ Force update completed!\n${status.slice(0, 1000)}` });

    // Check if dependencies need updating
    await sock.sendMessage(jid, { text: '📦 Checking dependencies...' });
    const npmOutput = execSync('npm install').toString();
    
    console.log('NPM Output:', npmOutput);
    await sock.sendMessage(jid, { text: `📦 Dependencies updated:\n${npmOutput.slice(0, 1000)}` });

    // Restart bot
    await sock.sendMessage(jid, { text: '♻️ Bot will restart in 3 seconds...' });
    
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
    
    return true;
  } catch (updateErr) {
    console.error('Update error:', updateErr);
    await sock.sendMessage(jid, { text: `❌ Update failed: ${updateErr.message}` });
    return false;
  }
}