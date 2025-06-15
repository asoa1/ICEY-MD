// commands/fun/say.js
import pkg from '@whiskeysockets/baileys';
import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const command = 'say';
export const description = 'Convert text to speech and send as voice note';
export const category = 'fun';
export const usage = '<text>';

export const execute = async (sock, m, jid) => {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const args = text.split(' ');
    
    if (args.length < 2) {
        return sock.sendMessage(jid, {
            text: '❌ Please provide text to convert to speech\nExample: `.say Hello world!`'
        });
    }
    
    const message = text.replace('.say ', '').trim();
    
    try {
        // Create temporary directory if needed
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const outputPath = path.join(tempDir, `voice-${Date.now()}.mp3`);
        
        // Convert text to speech
        await new Promise((resolve, reject) => {
            const gtts = new gTTS(message, 'en');
            gtts.save(outputPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Read the generated audio file
        const audioData = fs.readFileSync(outputPath);

        // Add this before sending
await sock.sendMessage(jid, {
  audio: audioData,
  mimetype: 'audio/mpeg',
  ptt: true,
  contextInfo: {
      externalAdReply: {
          title: 'ICEY-MD Voice Note',
          body: 'Tap to listen',
          thumbnail: fs.readFileSync('media/icey_md_menu.jpg')
      }
  },
  caption: `🔊 *Voice Note:*\n"${message}"`
});
        
       
        // Clean up temporary file
        fs.unlinkSync(outputPath);
        
    } catch (error) {
        console.error('Say command error:', error);
        
        let errorMessage = '❌ Failed to generate voice note';
        if (error.message.includes('No internet connection')) {
            errorMessage = '⚠️ Internet connection required for text-to-speech';
        } else if (error.message.includes('too long')) {
            errorMessage = '⚠️ Text too long! Maximum 200 characters';
        }
        
        await sock.sendMessage(jid, { text: errorMessage });
    }
};