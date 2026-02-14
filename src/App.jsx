import { useState, useEffect } from 'react';
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(import.meta.env.VITE_HF_TOKEN);

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState('start'); 
  const [techCategories, setTechCategories] = useState(["JavaScript", "React", "Bazy Danych", "DevOps", "Cyberbezpieczeństwo"]);
  const [genCategories, setGenCategories] = useState(["Historia", "Geografia", "Film", "Literatura", "Sport"]);
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState(() => JSON.parse(localStorage.getItem('quiz_scores')) || []);
  const [showLB, setShowLB] = useState(false); 
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const cleanAIOutput = (text) => {
    return text
      .replace(/\*\*.*?\*\*/g, '') 
      .replace(/^(Oto|Podaję|Tu są|Poniżej).*?[:\n]/gi, '') 
      .replace(/^\d+[\.\)]\s*/gm, '') 
      .replace(/[*#_]/g, '') 
      .trim();
  };

  const refreshCategories = async () => {
    setIsLoading(true);
    try {
      const response = await hf.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ 
          role: "user", 
          content: "STRICT RULES: Give 10 categories in Polish. 5 IT/Tech, 5 General. Format: cat1,cat2,cat3... No intro. No words before the first category." 
        }],
        max_tokens: 100
      });
      
      const rawText = cleanAIOutput(response.choices[0].message.content);
      const cleanParts = rawText.split(/[,\n;]/).map(c => c.trim()).filter(c => c.length > 2);

      if(cleanParts.length >= 8) {
        setTechCategories(cleanParts.slice(0, 5));
        setGenCategories(cleanParts.slice(5, 10));
      }
    } catch (e) { console.error("Error categories", e); }
    setIsLoading(false);
  };

  const fetchQuestions = async (selectedCat) => {
    setIsLoading(true);
    setCategory(selectedCat);
    setScore(0);
    setQuestions([]);
    
    try {
      const response = await hf.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          { role: "system", content: "You are a quiz bot. Respond ONLY with raw data. No introduction." },
          { role: "user", content: `Generate ${numQuestions} quiz questions about ${selectedCat} in Polish.
          Format: Question|OptionA,OptionB,OptionC,OptionD|CorrectOption
          Example: Stolica Polski?|Warszawa,Kraków,Łódź,Gdańsk|Warszawa` }
        ],
        max_tokens: 1500,
        temperature: 0.6
      });
      
      const content = response.choices[0].message.content;
      const lines = content.split("\n").filter(l => l.includes("|"));
      
      const parsed = lines.map(line => {
        const parts = line.split("|");
        if (parts.length < 3) return null;
        
        const qRaw = cleanAIOutput(parts[0]);
        const options = parts[1].split(",").map(o => o.trim());
        const correct = parts[2].trim();

        if (qRaw.length < 4 || options.length < 2) return null;

        return { 
          q: qRaw, 
          a: [...options].sort(() => Math.random() - 0.5), 
          correct: correct 
        };
      }).filter(item => item !== null);

      if (parsed.length > 0) {
        setQuestions(parsed);
        setGameState('quiz');
        setCurrentQuestion(0);
        setTimeLeft(25);
      } else {
        throw new Error("Pusty format");
      }
    } catch (e) { 
      alert("AI wysłało błędny tekst. Spróbuj kliknąć kategorię jeszcze raz."); 
    }
    setIsLoading(false);
  };

  const handleAnswer = (ans) => {
    const isCorrect = ans === questions[currentQuestion].correct;
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(nextScore);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(25);
    } else {
      const newEntry = { cat: category, score: nextScore, total: questions.length, date: new Date().toLocaleDateString() };
      const newLB = [newEntry, ...leaderboard].slice(0, 5);
      setLeaderboard(newLB);
      localStorage.setItem('quiz_scores', JSON.stringify(newLB));
      setGameState('result');
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'quiz' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'quiz') {
      handleAnswer("TIMEOUT");
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const theme = darkMode ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900";
  const cardStyle = darkMode ? "bg-[#1e293b] border-slate-700 shadow-2xl" : "bg-white border-slate-200 shadow-xl";

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 transition-colors duration-500 ${theme}`}>
      <button onClick={() => setDarkMode(!darkMode)} className="fixed top-6 right-6 p-4 rounded-full border border-blue-500/20 bg-blue-500/10 hover:scale-110 transition-transform text-xl z-10">
        {darkMode ? "☀️" : "🌙"}
      </button>

      {isLoading ? (
        <div className="text-center">
          <div className="w-20 h-20 border-[10px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="font-black text-blue-500 animate-pulse tracking-widest text-2xl uppercase italic">Buduję Quiz...</p>
        </div>
      ) : gameState === 'start' ? (
        <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-16">
            <h1 className="text-9xl font-black italic text-blue-600 tracking-tighter uppercase mb-2">QUIZLATOR</h1>
            <div className="flex items-center justify-center gap-6 mt-8">
               <span className="text-sm font-black uppercase opacity-40">Ilość Pytań:</span>
               <input type="number" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="bg-blue-600/10 border-b-4 border-blue-600 text-5xl font-black w-24 text-center outline-none rounded-t-xl" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="text-blue-500 font-black uppercase tracking-[0.3em] text-center italic text-xs">IT & Development</h3>
              {techCategories.map(c => (
                <button key={c} onClick={() => fetchQuestions(c)} className={`w-full p-6 rounded-2xl border-2 font-black text-left hover:border-blue-500 hover:bg-blue-500/5 transition-all ${cardStyle}`}>{c}</button>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-purple-500 font-black uppercase tracking-[0.3em] text-center italic text-xs">Wiedza Ogólna</h3>
              {genCategories.map(c => (
                <button key={c} onClick={() => fetchQuestions(c)} className={`w-full p-6 rounded-2xl border-2 font-black text-left hover:border-purple-500 hover:bg-purple-500/5 transition-all ${cardStyle}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <button onClick={refreshCategories} className="px-10 py-4 bg-blue-600 text-white font-black rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-xl uppercase text-sm italic">
                🔄 Nowe Kategorie
              </button>
              <button onClick={() => setShowLB(!showLB)} className="px-10 py-4 border-2 border-blue-600 text-blue-600 font-black rounded-full hover:bg-blue-600 hover:text-white transition-all uppercase text-sm italic">
                🏆 Ranking
              </button>
            </div>
            {showLB && (
              <div className={`w-full max-w-md p-6 rounded-3xl border animate-in slide-in-from-top-4 ${cardStyle}`}>
                <h4 className="text-center font-black uppercase text-xs tracking-widest mb-4 opacity-50">Ostatnie 5 wyników</h4>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-xs opacity-30 italic">Brak rozegranych gier</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-blue-500/5 border border-white/5">
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase">{entry.cat}</span>
                          <span className="text-[10px] opacity-40">{entry.date}</span>
                        </div>
                        <span className="font-black text-blue-500 text-lg">{entry.score}/{entry.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : gameState === 'result' ? (
        <div className={`w-full max-w-md p-16 rounded-[4rem] border text-center ${cardStyle}`}>
          <h2 className="text-4xl font-black mb-2 opacity-50 uppercase italic">Koniec!</h2>
          <div className="text-[140px] leading-none font-black text-blue-600 mb-12">{score}/{questions.length}</div>
          <button onClick={() => setGameState('start')} className="w-full py-8 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700">Menu Główne</button>
        </div>
      ) : (
        <div className={`w-full max-w-4xl p-12 md:p-16 rounded-[4rem] border ${cardStyle} animate-in slide-in-from-bottom-10`}>
          <div className="flex justify-between items-center mb-16">
            <div>
              <span className="text-blue-500 font-black uppercase tracking-widest text-sm">{category}</span>
              <p className="text-[10px] font-black opacity-30 uppercase">Pytanie {currentQuestion + 1} / {questions.length}</p>
            </div>
            <div className={`text-5xl font-black w-24 h-24 flex items-center justify-center rounded-3xl border-4 ${timeLeft < 10 ? 'text-red-500 border-red-500 animate-pulse' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}>
              {timeLeft}
            </div>
          </div>
          <div className="min-h-[160px] mb-12 flex items-center">
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
              {questions[currentQuestion]?.q}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {questions[currentQuestion]?.a.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)} className={`p-8 text-left rounded-3xl border-2 font-bold text-xl transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
                <span className="opacity-20 mr-4 font-black">0{i+1}</span> {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;