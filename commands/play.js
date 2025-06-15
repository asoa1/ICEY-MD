import yts from 'yt-search';

export const command = 'play';
export const execute = async (sock, m, jid) => {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
  const query = text?.split(' ').slice(1).join(' ');

  if (!query) {
    await sock.sendMessage(jid, { text: '❓ Type something to search, like `.play blinding lights`' });
    return;
  }

  try {
    const results = await yts(query);
    const videos = results.videos.slice(0, 5); // top 5 results

    if (!videos.length) {
      await sock.sendMessage(jid, { text: '❌ No results found.' });
      return;
    }

    let msg = `🔍 *YouTube Search Results for:* _${query}_\n\n`;
    videos.forEach((video, i) => {
      msg += `*${i + 1}. ${video.title}*\n👤 ${video.author.name} | ⏱️ ${video.timestamp}\n🔗 ${video.url}\n\n`;
    });

    await sock.sendMessage(jid, { text: msg }, { quoted: m });

  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, { text: '❌ Something went wrong while searching.' });
  }
};
