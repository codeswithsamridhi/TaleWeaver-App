import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import PdfViewer from './components/PdfViewer.jsx';
import './App.css';

// --- Reusable Components ---

function AnimatedBackground() {
  useEffect(() => {
    const bg = document.getElementById('animated-bg');
    if (bg && !bg.children.length) {
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        const s = Math.random() * 40 + 5;
        p.style.width = `${s}px`; p.style.height = `${s}px`;
        p.style.top = `${Math.random()*100}%`; p.style.left = `${Math.random()*100}%`;
        const d = Math.random()*15+20;
        p.style.animationDuration = `${d}s`; p.style.animationDelay = `${Math.random()*10}s`;
        bg.appendChild(p);
      }
    }
  }, []);
  return <div id="animated-bg" className="animated-bg"></div>;
}

// --- Main App Component ---
function App() {
  const [mode, setMode] = useState('personal');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [initialPrefs, setInitialPrefs] = useState({ genre: 'Romance', mood: 'Fluffy as a Marshmallow' });

  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      const { name, genre, mood } = JSON.parse(savedPrefs);
      setUserName(name);
      setInitialPrefs({ genre, mood });
      localStorage.removeItem('userPreferences');
    }
  }, []);

  useEffect(() => {
    if (mode === 'universe') {
      document.body.classList.add('universe-mode-bg');
    } else {
      document.body.classList.remove('universe-mode-bg');
    }
  }, [mode]);

  const downloadStory = () => {
    if (!aiResponse) return;
    const doc = new jsPDF();
    const title = "My Alternate Story";
    const splitTitle = doc.splitTextToSize(title, 180);
    const splitText = doc.splitTextToSize(aiResponse, 180);
    doc.text(splitTitle, 10, 10);
    doc.text(splitText, 10, 20);
    doc.save(`${title}.pdf`);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="app-header">
        <h1>{userName ? `Welcome, ${userName}!` : 'TaleWeaver ✨'}</h1>
        <p>Your story, reimagined.</p>
      </div>
      <div className="mode-switcher">
        <button className={mode === 'personal' ? 'active' : ''} onClick={() => setMode('personal')}>Personal Library</button>
        <button className={mode === 'universe' ? 'active' : ''} onClick={() => setMode('universe')}>Alternate Universe</button>
      </div>
      
      {mode === 'personal' ? (
        <PersonalLibraryTool setAiResponse={setAiResponse} setIsLoading={setIsLoading} initialPrefs={initialPrefs} />
      ) : (
        <AlternateUniverseTool setAiResponse={setAiResponse} setIsLoading={setIsLoading} initialPrefs={initialPrefs} />
      )}

      {isLoading && <p style={{textAlign: 'center', fontSize: '1.2rem', margin: '20px'}}>Weaving a new tale...</p>}
      
      {aiResponse && (
        <div className="ai-response">
          <div className="ai-response-header">
            <h2>AI's New Version:</h2>
            <button onClick={downloadStory} className="button-primary">Download PDF</button>
          </div>
          <p>{aiResponse}</p>
        </div>
      )}
    </>
  );
}

// --- "Personal Library" Tool Component ---
function PersonalLibraryTool({ setAiResponse, setIsLoading, initialPrefs }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [showRewriteModal, setShowRewriteModal] = useState(false);

  const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); setSelectedText(''); setAiResponse(''); setAnnotations([]); };
  const handleTextSelect = () => { const text = window.getSelection().toString().trim(); if (text) setSelectedText(text); };
  const handleHighlight = (color) => { if (!selectedText) { alert("Please select text first!"); return; } setAnnotations([{ text: selectedText, color, note: '' }, ...annotations]); };
  const handleUpdateNote = (index, note) => { const newAnnotations = [...annotations]; newAnnotations[index].note = note; setAnnotations(newAnnotations); };
  const handleRewriteClick = () => { if(selectedText) setShowRewriteModal(true); else alert("Please select text to rewrite."); };

  const handleRewriteSubmit = async ({ prompt, genre, mood, customMood }) => {
    if (!selectedText || !prompt) { alert("Please enter a rewrite instruction."); return; }
    let finalMood = mood;
    const moodLibrary = [ { emoji: '🧁', name: 'Fluffy as a Marshmallow' }, { emoji: '😎', name: 'Main Character Energy' }, { emoji: '😭', name: 'Tears Loading...' }, { emoji: '🧨', name: 'Drama Bomb Activated' }, { emoji: '😂', name: 'Full Tu Jhakaas Comedy' }, { emoji: '😵‍💫', name: 'Kya Hi Ho Raha Hai Bro?' }, { emoji: '💀', name: 'Dark But Make It Aesthetic' }, { emoji: '🧘‍♀️', name: 'Vibe Check: Passed' }, { emoji: '🧚', name: 'Nani Ne Kaha Tha Yeh Jadoo Hai' }, ];
    if (mood === 'Surprise Me') finalMood = moodLibrary[Math.floor(Math.random() * moodLibrary.length)].name;
    else if (mood === 'Craft Your Own') { if (!customMood) { alert('Please type in your custom mood!'); return; } finalMood = customMood; }
    
    setIsLoading(true); setAiResponse(''); setShowRewriteModal(false);
    try {
      const response = await axios.post('https://taleweaver-backend.onrender.com/api/rewrite', { selectedText, prompt, mood: finalMood, genre });
      setAiResponse(response.data.rewrittenStory);
    } catch (error) {
      console.error("Error calling AI rewrite API:", error);
      alert("Failed to get a response from the AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout" onMouseUp={handleTextSelect}>
      <CreativeTools onHighlight={handleHighlight} annotations={annotations} onUpdateNote={handleUpdateNote} selectedTextForRewrite={selectedText} onRewriteClick={handleRewriteClick} />
      <div className="main-content-area">
        <p>Upload a PDF from your personal library to begin.</p>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <div className="pdf-viewer-container"><PdfViewer file={selectedFile} /></div>
      </div>
      {showRewriteModal && <RewriteModal selectedText={selectedText} onClose={() => setShowRewriteModal(false)} onSubmit={handleRewriteSubmit} initialPrefs={initialPrefs} />}
    </div>
  );
}

// --- "Alternate Universe" Tool Component ---
function AlternateUniverseTool({ setAiResponse, setIsLoading, initialPrefs }) {
    const [formData, setFormData] = useState({
        bookTitle: '',
        authorName: '',
        sceneDescription: '',
        prompt: '',
        genre: initialPrefs.genre,
        mood: initialPrefs.mood
    });
    const moodLibrary = [ { emoji: '🧁', name: 'Fluffy as a Marshmallow' }, { emoji: '😎', name: 'Main Character Energy' }, { emoji: '😭', name: 'Tears Loading...' }, { emoji: '🧨', name: 'Drama Bomb Activated' }, { emoji: '😂', name: 'Full Tu Jhakaas Comedy' }, { emoji: '😵‍💫', name: 'Kya Hi Ho Raha Hai Bro?' }, { emoji: '💀', name: 'Dark But Make It Aesthetic' }, { emoji: '🧘‍♀️', name: 'Vibe Check: Passed' }, { emoji: '🧚', name: 'Nani Ne Kaha Tha Yeh Jadoo Hai' }, ];
    const genreLibrary = [ { emoji: '💘', name: 'Romance' }, { emoji: '🔍', name: 'Mystery' }, { emoji: '🧝', name: 'Fantasy' }, { emoji: '🎭', name: 'Drama' }, { emoji: '😹', name: 'Comedy' }, { emoji: '🧨', name: 'Thriller' }, { emoji: '👑', name: 'Historical' }, { emoji: '👻', name: 'Horror' }, { emoji: '🌈', name: 'YA (Teen Fic)' }, { emoji: '🤖', name: 'Sci-Fi' }, { emoji: '🔮', name: 'Supernatural' }, { emoji: '🎨', name: 'Slice of Life' }, { emoji: '📚', name: 'Non-Fiction' }, ];


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setAiResponse('');
        try {
            const response = await axios.post('https://taleweaver-backend.onrender.com/api/generate', formData);
            setAiResponse(response.data.generatedStory);
        } catch (error) {
            console.error("Error calling AI generation API:", error);
            alert("Failed to get a response from the AI.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-content-area">
             <p>Describe a scene from a published book and tell the AI how to change it!</p>
             <form onSubmit={handleSubmit} className="universe-form">
                <label htmlFor="bookTitle">Book Title</label>
                <input type="text" name="bookTitle" value={formData.bookTitle} onChange={handleChange} placeholder="e.g., The Hobbit" required />
                
                <label htmlFor="authorName">Author's Name</label>
                <input type="text" name="authorName" value={formData.authorName} onChange={handleChange} placeholder="e.g., J.R.R. Tolkien" required />

                <label htmlFor="sceneDescription">Current Scene / Chapter</label>
                <textarea name="sceneDescription" value={formData.sceneDescription} onChange={handleChange} rows="3" placeholder="e.g., The part where Bilbo meets Gollum in the cave." required />

                <label htmlFor="prompt">Your "What If..." Idea</label>
                <textarea name="prompt" value={formData.prompt} onChange={handleChange} rows="3" placeholder="e.g., What if Bilbo decided to stay with Gollum and learn the ways of the cave?" required />
                
                <div className="controls-grid">
                    <div>
                        <label htmlFor="genre">Desired Genre</label>
                        <select name="genre" value={formData.genre} onChange={handleChange}>
                          {genreLibrary.map((g) => (<option key={g.name} value={g.name}>{g.emoji} {g.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mood">Desired Mood</label>
                        <select name="mood" value={formData.mood} onChange={handleChange}>
                          {moodLibrary.map((m) => (<option key={m.name} value={m.name}>{m.emoji} {m.name}</option>))}
                        </select>
                    </div>
                </div>
                <button type="submit">Generate New Story</button>
             </form>
        </div>
    );
}


// --- Other Components (CreativeTools, RewriteModal, etc.) ---
function CreativeTools({ onHighlight, annotations, onUpdateNote, selectedTextForRewrite, onRewriteClick }) {
  const [selectedColor, setSelectedColor] = useState('#ffdd57');
  const [activeStickerPanel, setActiveStickerPanel] = useState(null);
  const colors = ['#ffdd57', '#ff6b6b', '#7ed5ea', '#a0e8a0', '#c5a0e8'];
  const stickers = ['✨', '❤️', '🔥', '💡', '🤔', '😂', '😭', '🤯', '✍️', '👀', '🤫', '💀'];

  const handleSuggestQuote = async (index) => {
    try {
        const highlightedText = annotations[index].text;
        // UPDATED: This now points to the live backend URL
        const response = await axios.post('https://taleweaver-backend.onrender.com/api/suggest-quote', { highlightedText });
        const suggestions = response.data.suggestions.split('\n').filter(q => q.trim() !== '');
        onUpdateNote(index, suggestions[Math.floor(Math.random() * suggestions.length)]);
    } catch (error) { alert("Sorry, couldn't get a suggestion from the AI."); }
  };
  const handleAddSticker = (index, sticker) => { onUpdateNote(index, annotations[index].note + sticker); setActiveStickerPanel(null); };

  return (
    <div className="tools-sidebar">
      <h2>Creative Tools</h2>
      <h3>Highlighter</h3>
      <div className="color-palette">{colors.map(color => <div key={color} className={`color-swatch ${selectedColor === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => { setSelectedColor(color); onHighlight(color); }} />)}</div>
      <div className="rewrite-section-sidebar">
        <h3>Rewrite Scene</h3>
        {selectedTextForRewrite ? (<><p className="selected-text-sidebar">"{selectedTextForRewrite}"</p><button onClick={onRewriteClick} className="rewrite-button-sidebar">Rewrite This Scene ✨</button></>) : <p style={{textAlign: 'left', color: '#999', fontSize: '0.9rem'}}>Select text to enable rewrite.</p>}
      </div>
      <h3>Annotations</h3>
      <div className="annotations-list">
        {annotations.length > 0 ? annotations.map((anno, index) => (
          <div key={index} className="annotation-item">
            <p style={{ backgroundColor: anno.color, color: '#000' }}>"{anno.text}"</p>
            <textarea placeholder="Add a note..." value={anno.note} onChange={(e) => onUpdateNote(index, e.target.value)} />
            <div className="annotation-tools">
              <div className="annotation-buttons"><button onClick={() => handleSuggestQuote(index)}>Suggest Quote ✨</button><button onClick={() => setActiveStickerPanel(activeStickerPanel === index ? null : index)}>Add Sticker 🎨</button></div>
              {activeStickerPanel === index && <div className="sticker-panel"><div className="sticker-grid">{stickers.map(s => <span key={s} className="sticker" onClick={() => handleAddSticker(index, s)}>{s}</span>)}</div></div>}
            </div>
          </div>
        )) : <p style={{textAlign: 'left', color: '#999'}}>Highlight text to create an annotation.</p>}
      </div>
    </div>
  );
}

function RewriteModal({ selectedText, onClose, onSubmit, initialPrefs }) {
    const [prompt, setPrompt] = useState('');
    const [genre, setGenre] = useState(initialPrefs.genre);
    const [mood, setMood] = useState(initialPrefs.mood);
    const [customMood, setCustomMood] = useState('');
    const moodLibrary = [ { emoji: '🧁', name: 'Fluffy as a Marshmallow' }, { emoji: '😎', name: 'Main Character Energy' }, { emoji: '😭', name: 'Tears Loading...' }, { emoji: '🧨', name: 'Drama Bomb Activated' }, { emoji: '😂', name: 'Full Tu Jhakaas Comedy' }, { emoji: '😵‍💫', name: 'Kya Hi Ho Raha Hai Bro?' }, { emoji: '💀', name: 'Dark But Make It Aesthetic' }, { emoji: '🧘‍♀️', name: 'Vibe Check: Passed' }, { emoji: '🧚', name: 'Nani Ne Kaha Tha Yeh Jadoo Hai' }, ];
    const genreLibrary = [ { emoji: '💘', name: 'Romance' }, { emoji: '🔍', name: 'Mystery' }, { emoji: '🧝', name: 'Fantasy' }, { emoji: '🎭', name: 'Drama' }, { emoji: '😹', name: 'Comedy' }, { emoji: '🧨', name: 'Thriller' }, { emoji: '�', name: 'Historical' }, { emoji: '👻', name: 'Horror' }, { emoji: '🌈', name: 'YA (Teen Fic)' }, { emoji: '🤖', name: 'Sci-Fi' }, { emoji: '🔮', name: 'Supernatural' }, { emoji: '🎨', name: 'Slice of Life' }, { emoji: '📚', name: 'Non-Fiction' }, ];

    const handleSubmit = () => onSubmit({ prompt, genre, mood, customMood });

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Rewrite This Scene</h3>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p className="selected-text">"{selectedText}"</p>
                    <div className="controls-grid">
                      <div><label htmlFor="genre-select">Select a Genre:</label><select id="genre-select" value={genre} onChange={(e) => setGenre(e.target.value)}>{genreLibrary.map((g) => (<option key={g.name} value={g.name}>{g.emoji} {g.name}</option>))}</select></div>
                      <div><label htmlFor="mood-select">Select a Mood:</label><select id="mood-select" value={mood} onChange={(e) => setMood(e.target.value)}>{moodLibrary.map((m) => (<option key={m.name} value={m.name}>{m.emoji} {m.name}</option>))} <option value="Surprise Me">🎲 Bhai Jo Bhi Ho, Surprise Kar</option> <option value="Craft Your Own">✍️ Craft Your Own Mood</option></select></div>
                    </div>
                    {mood === 'Craft Your Own' && (<input type="text" placeholder="Type your own chaotic energy..." value={customMood} onChange={(e) => setCustomMood(e.target.value)} style={{ marginTop: '10px', width: '100%', boxSizing: 'border-box' }}/>)}
                    <textarea rows="3" placeholder="e.g., Make this scene more romantic." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </div>
                <div className="modal-buttons">
                    <button onClick={onClose} className="button-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="button-primary">Rewrite with AI</button>
                </div>
            </div>
        </div>
    )
}

export default App;