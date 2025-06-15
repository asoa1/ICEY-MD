// commands/auto_react.js
let autoReactEmoji = '❄️';
let autoReactEnabled = false;

export const name = 'auto_react';
export const description = 'Enable auto reaction to all messages';
export const execute = async (sock, msg, args) => {
  if (args.length > 0) {
    autoReactEmoji = args[0];
    autoReactEnabled = true;
    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Auto-react enabled with emoji: ${autoReactEmoji}`
    });
  } else {
    autoReactEnabled = !autoReactEnabled;
    await sock.sendMessage(msg.key.remoteJid, {
      text: autoReactEnabled
        ? `✅ Auto-react enabled with emoji: ${autoReactEmoji}`
        : '❌ Auto-react disabled'
    });
  }
};

// Export autoReact status for use in main loop
export const getAutoReactConfig = () => ({
  autoReactEnabled,
  autoReactEmoji
});
