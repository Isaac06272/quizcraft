import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    console.log("Asking Google for available models...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        console.log("\n--- AVAILABLE MODELS FOR YOUR KEY ---");
        data.models.forEach(model => {
            // We only care about models that can generate text/JSON
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(model.name.replace('models/', '')); 
            }
        });
        console.log("-------------------------------------\n");
    } catch (error) {
        console.error("Failed to connect:", error);
    }
}

listModels();