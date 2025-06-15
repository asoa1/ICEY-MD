import { execSync } from 'child_process';
import fetch from 'node-fetch';

const REPO_OWNER = 'asoa1';
const REPO_NAME = 'ICEY-MD';
let updateAvailable = false;
let updateMessage = '';
let updateCheckInterval;
let ownerJID = null;

export async function checkForUpdates(sock) {
  try {
    if (!sock) {
      console.error('❌ Cannot check updates: sock not provided');
      return false;
    }
    
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
      if (ownerJID && sock) {
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
  if (!sock || !initialOwnerJID) {
    console.error('❌ Cannot start update checks: missing sock or owner JID');
    return;
  }
  
  ownerJID = initialOwnerJID;
  console.log(`👑 Update system owner: ${ownerJID}`);
  
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
    await sock.sendMessage(jid, { text: '🔄 Updating from GitHub repository...' });

    // Execute git pull
    const gitPull = execSync('git pull https://github.com/asoa1/ICEY-MD main').toString();
    console.log('Git Output:\n', gitPull);
    
    // Truncate long output
    const truncatedOutput = gitPull.length > 1500 
      ? gitPull.substring(0, 1500) + '... (output truncated)' 
      : gitPull;
    
    await sock.sendMessage(jid, { text: `📥 Update Result:\n${truncatedOutput}` });

    // Check if dependencies need updating
    let npmOutput = '';
    if (gitPull.includes('package.json') || gitPull.includes('node_modules')) {
      await sock.sendMessage(jid, { text: '📦 Installing updated dependencies...' });
      npmOutput = execSync('npm install').toString();
      
      console.log('NPM Output:', npmOutput);
      
      // Truncate npm output
      const truncatedNpm = npmOutput.length > 1000 
        ? npmOutput.substring(0, 1000) + '...' 
        : npmOutput;
      
      await sock.sendMessage(jid, { text: `📦 Dependencies updated:\n${truncatedNpm}` });
    }

    await sock.sendMessage(jid, { text: '♻️ Bot will restart automatically in 3 seconds...' });
    return true;
  } catch (updateErr) {
    console.error('Update error:', updateErr);
    await sock.sendMessage(jid, { text: `❌ Update failed: ${updateErr.message}` });
    return false;
  }
}