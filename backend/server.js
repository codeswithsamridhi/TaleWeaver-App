require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// Endpoint for PDF-based rewrites
app.post('/api/rewrite', async (req, res) => {
  try {
    const { selectedText, prompt, mood, genre } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const aiPrompt = `You are a master ghostwriter. Your task is to rewrite a book. The last scene was: "${selectedText}". The user's instruction is: "${prompt}". The desired genre is "${genre}" and mood is "${mood}". Write the ENTIRE rest of the book (at least 15-20 new, full-length chapters) with a full plot arc, mimicking the original author's style. Structure with clear chapter headings.`;
    
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const rewrittenStory = response.text();

    res.json({ success: true, rewrittenStory });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate content from AI.' });
  }
});

// Endpoint for the "Alternate Universe" mode
app.post('/api/generate', async (req, res) => {
    try {
        const { bookTitle, authorName, sceneDescription, prompt, mood, genre } = req.body;
        if (!bookTitle || !authorName || !sceneDescription || !prompt || !mood || !genre) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const aiPrompt = `You are a master storyteller with encyclopedic knowledge of all published books. A user wants you to generate an alternate story for a book they are reading. Book Title: ${bookTitle}, Author's Name: ${authorName}, Current Position: ${sceneDescription}, "What If" Scenario: ${prompt}, Desired Genre: ${genre}, Desired Mood: ${mood}. Your Mission: Write the ENTIRE rest of the story from this point. CRITICAL: You must perfectly mimic the original author's writing style. The story must be extremely long (10-15 new, full-length chapters), have a full plot arc, and a satisfying conclusion. Structure with clear chapter headings.`;
        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const generatedStory = response.text();
        res.json({ success: true, generatedStory });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate story from AI.' });
    }
});

// --- NEW: API Endpoint for AI Quote Suggestions ---
app.post('/api/suggest-quote', async (req, res) => {
    try {
        const { highlightedText } = req.body;
        if (!highlightedText) {
            return res.status(400).json({ error: 'Highlighted text is required.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        // A specific prompt just for generating annotation quotes
        const aiPrompt = `A user has highlighted the following text from a story: "${highlightedText}". 
        Generate exactly 3 short, clever, and poetic annotation quotes inspired by this text. The quotes should be suitable for a reader's personal notes.
        Return only the 3 quotes, each on a new line. Do not add any other text or formatting.`;

        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const suggestions = response.text();

        res.json({ success: true, suggestions });

    } catch (error) {
        console.error('AI Quote Suggestion Error:', error);
        res.status(500).json({ error: 'Failed to generate quote suggestions.' });
    }
});


app.listen(PORT, () => {
  console.log(`TaleWeaver server is listening on http://localhost:${PORT}`);
});