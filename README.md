# 🧠 QuizCraft 

![QuizCraft Hero Image](https://via.placeholder.com/1200x600/1a1333/8b5cf6?text=QuizCraft+-+AI+Study+Platform)
> *Note: Replace the image link above with an actual screenshot of your home screen!*

QuizCraft is an AI-powered study platform that instantly transforms your notes, lecture slides, and reading materials into interactive quizzes and flashcards. Designed with a beautiful glassmorphism UI, it helps students and lifelong learners utilize "active recall" to master any subject in a fraction of the time.

## 🎯 The Problem It Solves
Creating study materials manually is tedious, time-consuming, and inefficient. Students often spend hours simply writing flashcards or crafting practice questions instead of actually studying the material. 

**QuizCraft solves this by:**
1. **Automating extraction:** Taking raw documents (PDF, TXT, DOCX) and instantly parsing the core concepts.
2. **Generating active recall tools:** Using advanced AI to create highly accurate multiple-choice questions and interactive flashcards.
3. **Organizing knowledge:** Providing a structured, cloud-based library system so users never lose their study sets.

## ✨ Key Features
- **🤖 AI Content Generation:** Powered by Gemini 2.5 Flash, generating tailored study items based on user-defined counts (from quick 5-question reviews to 50-item deep dives).
- **📂 Cloud Library & Workspace:** Create custom subject folders, categorize materials, and move files dynamically.
- **🔀 Advanced Shuffle Mode:** Randomize question and multiple-choice option orders to ensure actual learning rather than visual memorization.
- **🏆 Progress Tracking:** Automatically scores quizzes and tracks your "Best Score" over time.
- **📱 Responsive Glassmorphism UI:** A sleek, glowing, dark-mode-first interface optimized for desktop, tablet, and mobile viewing.
- **🔐 Secure Authentication:** Google Sign-In integration protects your library and prevents unauthorized API usage.

## 🛠️ Tech Stack

**Frontend:**
- **React.js** (Hooks, State Management, React Router)
- **Tailwind CSS** (Responsive design, custom glowing gradients, glassmorphism)
- **Lucide React** (Crisp, modern iconography)

**Backend & AI:**
- **Node.js / Express** (File processing and API routing, hosted on Render)
- **Google Gemini 2.5 Flash API** (Core AI generation with fallback handling)

**Database & Auth:**
- **Firebase Firestore** (NoSQL database for users, folders, and materials)
- **Firebase Authentication** (Google OAuth)

## 🚀 Getting Started

To run QuizCraft locally, follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Firebase Project (with Firestore and Auth enabled)
- A Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/quizcraft.git](https://github.com/yourusername/quizcraft.git)
cd quizcraft
