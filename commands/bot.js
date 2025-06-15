import axios from 'axios';

export const command = 'bot';
export const execute = async (sock, m, jid) => {
  let query;

  // Try to extract message text safely
  if (m.message?.conversation) {
    query = m.message.conversation.split(' ').slice(1).join(' ');
  } else if (m.message?.extendedTextMessage?.text) {
    query = m.message.extendedTextMessage.text.split(' ').slice(1).join(' ');
  }

  if (!query) {
    await sock.sendMessage(jid, { text: '❓ Please ask something like: .bot what is a noun' });
    return;
  }

  try {
    const res = await axios.get('https://api.affiliateplus.xyz/api/chatbot', {
      params: {
        message: query,
        botname: 'SmartBot',
        ownername: 'You'
      }
    });

    const botReply = res.data.message || '🤖 Sorry, I have no answer.';

    await sock.sendMessage(jid, { text: botReply });
  } catch (err) {
    console.error('Bot API Error:', err.message);
    await sock.sendMessage(jid, { text: '❌ Failed to get response from bot API.' });
  }
};
