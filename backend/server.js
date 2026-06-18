import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import mammoth from 'mammoth'; // Added our new Word Doc reader!

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        const { studyMode, itemCount } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "No file uploaded" });

        console.log(`Processing ${file.originalname} for ${itemCount} ${studyMode}s...`);

        // 1. Define our exact instructions
        let prompt = "";
        if (studyMode === 'quiz') {
            prompt = `Analyze the provided material and create a multiple-choice quiz with exactly ${itemCount} questions. 
            Return ONLY a JSON array of objects. Each object must have exactly these keys: 
            "id" (number), "question" (string), "options" (array of exactly 4 strings), "correctAnswer" (string matching one of the options).`;
        } else {
            prompt = `Analyze the provided material and create exactly ${itemCount} flashcards. 
            Return ONLY a JSON array of objects. Each object must have exactly these keys: 
            "id" (number), "question" (string), "answer" (string).`;
        }

        const contentPayload = [];

        // 2. Handle the file based on its type!
        if (file.originalname.endsWith('.docx') || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log("Word Document detected. Extracting text manually...");
            
            // Crack open the Word Doc and extract the raw text
            const docxResult = await mammoth.extractRawText({ path: file.path });
            
            // Pass the extracted text directly to Gemini
            contentPayload.push({ text: `Here is the document text to analyze:\n\n${docxResult.value}\n\n` });
        } else {
            console.log("PDF or TXT detected. Uploading to Gemini File API...");
            
            const uploadResponse = await fileManager.uploadFile(file.path, {
                mimeType: file.mimetype,
                displayName: file.originalname,
            });
            contentPayload.push({
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            });
        }

        // Add our prompt instructions to the payload
        contentPayload.push({ text: prompt });

        // 3. Request the generation from the AI
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(contentPayload);

        // 4. Delete the temporary file from your local server
        fs.unlinkSync(file.path);

        // 5. Send the structured data back to React
        let rawText = result.response.text();
        
        if (rawText.startsWith("```json")) {
            rawText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
        }

        const generatedData = JSON.parse(rawText);
        res.json(generatedData);

    } catch (error) {
        console.error("Error generating content:", error);
        
        // Safety cleanup: delete file even if an error crashes the request
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to generate content." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));