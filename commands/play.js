import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const command = 'play';
export const execute = async (sock, m, jid) => {
  try {
    const text = m.message?.conversation || 
                 m.message?.extendedTextMessage?.text || '';
    
    // Extract URL or search query
    const input = text.split(' ').slice(1).join(' ').trim();
    
    if (!input) {
      return sock.sendMessage(jid, { 
        text: "❌ Please provide a song name or URL!\nExample: `.play abcdefu`" 
      });
    }

    let videoUrl = input;
    
    // If input is not a URL, search YouTube
    if (!input.startsWith('http')) {
      videoUrl = await searchYouTube(input);
      if (!videoUrl) {
        return sock.sendMessage(jid, { text: "❌ No results found!" });
      }
    }

    // Validate URL
    if (!ytdl.validateURL(videoUrl)) {
      return sock.sendMessage(jid, { text: "❌ Invalid YouTube URL!" });
    }

    // Get video info
    const info = await ytdl.getInfo(videoUrl);
    const video = info.videoDetails;

    // Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `${video.videoId}.mp3`);
    
    // Download audio
    const audioStream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    }).pipe(fs.createWriteStream(tempFile));
    
    await new Promise((resolve, reject) => {
      audioStream.on('finish', resolve);
      audioStream.on('error', reject);
    });

    // Send audio
    const audioData = fs.readFileSync(tempFile);
    await sock.sendMessage(jid, {
      audio: audioData,
      mimetype: 'audio/mp4',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: video.title || 'Music',
          body: video.author?.name || '',
          thumbnailUrl: video.thumbnails[0]?.url,
          mediaType: 1,
          mediaUrl: videoUrl,
          sourceUrl: videoUrl
        }
      }
    }, { quoted: m });

    // Cleanup
    fs.unlinkSync(tempFile);
    
  } catch (error) {
    console.error('Play command error:', error);
    sock.sendMessage(jid, { 
      text: `❌ Error: ${error.message || 'Failed to play song'}` 
    });
  }
};

// Simple YouTube search using ytdl-core
async function searchYouTube(query) {
  try {
    const searchResults = await ytdl.search(query, { limit: 1 });
    return searchResults[0]?.url;
  } catch {
    return null;
  }
}