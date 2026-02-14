#  QUIZLATOR — AI-Powered Trivia Engine

**Quizlator** is a modern, AI-driven web application that leverages Large Language Models (specifically Meta-Llama-3-8B) to generate trivia questions in real-time. It features dynamic categories, a persistent leaderboard, and a sleek, responsive UI with Dark/Light mode support.

##  Check it out

If you want to use this app it`s hosted here: **[QuizLator](https://piotruloszarini.github.io/QuizLator/)**.
If you want to run it on your own device follow the steps below 


##  API Configuration (Required)

To make this app work, you need your own (free) API Key from Hugging Face:

1. Create a free account at [huggingface.co](https://huggingface.co/).
2. Go to **Settings** -> **Access Tokens**.
3. Create a new token with **Read** role.
4. In the project root folder, create a file named `.env`.
5. Add the following line to the file:
   `VITE_HF_TOKEN=your_token_here`


##  How It Works (Architecture)

The application is built on three main technical pillars:

### 1. AI Integration (Hugging Face)
Instead of a static database, Quizlator uses the **Meta-Llama-3-8B-Instruct** model to create content on the fly.
* **Prompt Engineering**: The code sends structured instructions to the model to ensure it returns data in a parsable format (`Question|Options|Answer`).
* **Robust Parsing**: A custom `cleanAIOutput` function filters out "AI chatter" (intro sentences, markdown symbols) to prevent UI crashes.

### 2. State Management (React Hooks)
* **useState**: Manages the quiz lifecycle, including scores, the current question index, and loading states.
* **useEffect**: Handles the 25-second countdown timer logic and synchronizes the Dark Mode theme with the browser's settings.

### 3. Data Persistence (LocalStorage)
* **Leaderboard**: Your performance history is stored in the browser's `localStorage`. This ensures that your top 5 scores remain saved even after you refresh the page or close the browser.


##  Key Features
* **Dynamic Categories**: Refresh the starting screen to get 10 new topics (5 Tech-related, 5 General Knowledge).
* **Smart Filtering**: Built-in safeguards to handle "malformed" AI responses by retrying or cleaning the text.
* **Interactive UI**: Real-time feedback, smooth animations, and a mobile-friendly layout.

---

##  Troubleshooting
* **ENOENT Error**: If you see this error, it means you are in the wrong folder. Run `cd Quizlator` (or your specific folder name) before running `npm run dev`.
* **AI Format Error**: Occasionally, the AI might return an unexpected text format. If this happens, simply click the category again to generate a new set of questions.
