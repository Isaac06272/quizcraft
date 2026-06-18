const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq SDK with environment variable
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Ensure 'uploads' directory exists safely in production
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper function to extract text from file
// (Replace this dummy implementation if you use pdf-parse or mammoth.js)
function extractTextFromFile(filePath, mimeType) {
    if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf8');
    }
    // Fallback/Placeholder: if you have pdf-parse installed, parse it here.
    // For now, reading it as plain text or returning a message.
    return fs.readFileSync(filePath, 'utf8'); 
}

// --- API ROUTES ---

// Health check root route (prevents the 404 error on Render's homepage)
app.get('/', (req, res) => {
    res.send('QuizCraft Backend Server is Awake and Live on Groq!');
});

// The Core Generation Route
app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        // 1. Validate file upload
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // 2. Parse user configuration sent from frontend
        // Handles fallback defaults if options aren't provided
        const itemCount = req.body.itemCount || 5;
        const studyMode = req.body.studyMode || 'multiple-choice quiz';

        console.log(`Processing file: ${req.file.filename} for a ${itemCount}-item ${studyMode}...`);

        // 3. Extract text content from the file
        const filePath = req.file.path;
        let extractedText = '';
        
        try {
            extractedText = extractTextFromFile(filePath, req.file.mimetype);
        } catch (err) {
            console.error('Failed to extract text from file:', err);
            return res.status(500).json({ error: 'Failed to read the uploaded document content.' });
        } finally {
            // Clean up the file from the server immediately after reading it
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Quick check to prevent sending empty prompts to Groq
        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ error: 'The uploaded file appears to be empty.' });
        }

        // 4. Construct the prompt telling Groq exactly what to build
        const prompt = `You are a strict academic study assistant. Your job is to create a ${itemCount} item ${studyMode} based entirely on the source text provided below. 
        
        You must output ONLY a valid, raw JSON array containing the items without markdown blocks, commentary, or extra text.
        
        Source Text:
        ${extractedText}`;

        // 5. Query the blazing-fast Groq LPU engine using Meta's massive Llama 3 model
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }, // Guarantees structural JSON output
        });

        // 6. Grab the raw content from the model's response
        const aiResponseText = chatCompletion.choices[0]?.message?.content || "";

        // 7. Parse string to JSON object and send back to the frontend
        const generatedData = JSON.parse(aiResponseText);
        res.json(generatedData);

    } catch (error) {
        console.error('Groq Generation Backend Crash:', error);
        res.status(500).json({ 
            error: 'An internal server error occurred while processing the AI generation.', 
            details: error.message 
        });
    }
});

// Start the Express Server
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});