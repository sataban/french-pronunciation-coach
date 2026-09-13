import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Play, Flame, Home, BarChart3, History, Settings, ChevronRight, ChevronLeft, Volume2, Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ============================================================================
   DESIGN TOKENS
   White / Blue / Navy per brief. Amber reserved solely for streak flame.
   ========================================================================= */
const C = {
  bg: "#FFFFFF",
  navy: "#1B2A4A",
  navySoft: "#425372",
  blue: "#3B6FE0",
  blueSoft: "#EEF2FA",
  blueLine: "#D9E3F7",
  amber: "#C68A2E",
  red: "#C24545",
  redSoft: "#FBEAEA",
  amberSoft: "#FBF1E1",
  green: "#3E8E5C",
  greenSoft: "#EAF6EF",
  gray: "#8792A6",
  grayLine: "#E7EAF0",
};

/* ============================================================================
   PHONEME / CATEGORY TAXONOMY
   ========================================================================= */
const CATEGORIES = {
  r:        { label: "French R", ipa: "/ʁ/", tip: "Depuis le fond de la gorge, comme un léger raclement — pas la langue qui roule." },
  nasal:    { label: "Voyelles nasales", ipa: "/ɑ̃ ɛ̃ ɔ̃/", tip: "L'air passe par le nez : ne prononcez pas le \"n\" ou le \"m\" qui suit." },
  u:        { label: "French U", ipa: "/y/", tip: "Arrondissez les lèvres comme pour \"ou\", mais dites \"i\"." },
  eu:       { label: "Eu / Œu", ipa: "/ø œ/", tip: "Lèvres arrondies, langue en position de \"é\", ouverture moyenne." },
  liaison:  { label: "Liaison", ipa: "‿", tip: "Enchaînez la consonne finale muette avec la voyelle du mot suivant." },
  silent:   { label: "Lettres muettes", ipa: "∅", tip: "Les consonnes finales (sauf c, r, f, l) sont généralement muettes." },
  consonant:{ label: "Consonnes", ipa: "ʒ ʃ ɲ", tip: "\"ch\" = /ʃ/, \"gn\" = /ɲ/, \"j\"/\"g+e,i\" = /ʒ/." },
  rhythm:   { label: "Rythme & fluidité", ipa: "—", tip: "Groupes rythmiques réguliers, accent sur la dernière syllabe du groupe." },
};

/* Word bank tagged by category — used both for passage generation and
   word-level feedback after analysis. */
const WORD_BANK = {
  r: ["rouge","route","raconter","rêve","rivière","rare","rapide","recherche","rideau","rythme","répondre","rencontre","romain","rocher","rire"],
  nasal: ["maintenant","important","vraiment","comprendre","temps","enfant","vin","pain","bon","maison","conversation","instant","souvent","longtemps","ensemble"],
  u: ["lune","voiture","sûr","musique","nature","futur","utile","rue","sculpture","structure","culture","mesure","université","pur","statue"],
  eu: ["heureux","couleur","peu","professeur","peur","ordinateur","docteur","curieux","deux","monsieur","sérieux","chaleur","jeune","œuvre","fleur"],
  liaison: ["les enfants","un ami","nous avons","ils ont","très intéressant","grand homme","petit ami","dans un","sans arrêt","plus important"],
  consonant: ["chaque","magnifique","champignon","montagne","général","japonais","géographie","charger","gigantesque","enseignant","rechercher","voyageur"],
  silent: ["beaucoup","estomac","tabac","gens","toujours","dehors","dedans","printemps","corps","plusieurs","tard","nid"],
};

/* Topic pool used to keep subject variety even when targeting the same weak
   sound repeatedly (requirement: don't always generate the same subject). */
const TOPIC_POOL = ["Vie quotidienne","Voyage","Nourriture & cuisine","Science","Psychologie","Histoire","Culture","Nature","Technologie","Éducation","Actualités"];

const PREDEFINED_TOPICS = [
  "Daily Life","Travel","Food & Cooking","Science","Psychology",
  "History","Culture","Nature","Technology","Education","News","Random"
];

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

/* ============================================================================
   TEXT TEMPLATE BANK
   Real "AI generation" would call an LLM; here we compose from vetted
   sentence templates per level/topic, then splice in target-sound words
   naturally based on the user's weak-category priorities (70/30 split).
   ========================================================================= */
const OPENERS = {
  "Daily Life": ["Chaque matin, {subject} commence sa journée avec une tasse de café.","La vie de tous les jours peut sembler simple, mais {subject} y trouve toujours quelque chose d'intéressant.","Aujourd'hui, {subject} a décidé de changer un peu sa routine habituelle."],
  "Travel": ["Le mois dernier, {subject} a visité une région qu'il ne connaissait pas du tout.","Voyager permet à {subject} de découvrir des cultures très différentes.","{subject} prépare son prochain voyage avec beaucoup d'enthousiasme."],
  "Food & Cooking": ["En cuisine, {subject} aime expérimenter avec des ingrédients simples.","Le dimanche, {subject} passe des heures à préparer un repas pour ses amis.","La gastronomie française fascine {subject} depuis longtemps."],
  "Science": ["Les scientifiques étudient ce phénomène depuis plusieurs décennies.","La recherche récente a permis de mieux comprendre ce sujet complexe.","{subject} s'intéresse particulièrement aux découvertes scientifiques modernes."],
  "Psychology": ["La psychologie moderne s'intéresse de plus en plus à ce sujet.","{subject} a toujours été fasciné par le fonctionnement de l'esprit humain.","Comprendre nos émotions n'est pas toujours facile, mais {subject} essaie chaque jour."],
  "History": ["Il y a plusieurs siècles, cette région a connu de grands changements.","{subject} adore lire sur les événements historiques marquants.","L'histoire nous apprend beaucoup sur notre société actuelle."],
  "Culture": ["La culture d'un pays se reflète dans sa musique, son art et ses traditions.","{subject} s'intéresse à la culture française depuis son enfance.","Chaque région a ses propres coutumes, souvent très différentes."],
  "Nature": ["La nature offre des paysages absolument magnifiques.","{subject} aime se promener en forêt pour observer les oiseaux.","Protéger l'environnement est devenu une priorité pour beaucoup de gens."],
  "Technology": ["La technologie évolue si rapidement qu'il est difficile de suivre toutes les nouveautés.","{subject} utilise plusieurs applications chaque jour pour organiser son travail.","L'intelligence artificielle transforme de nombreux secteurs."],
  "Education": ["L'éducation reste, selon {subject}, la clé pour construire un avenir meilleur.","À l'école, {subject} a toujours aimé les matières scientifiques.","Apprendre une nouvelle langue demande de la patience et de la régularité."],
  "News": ["Les journaux publient chaque jour des nouvelles qui influencent notre société.","{subject} suit l'actualité avec beaucoup d'attention.","Cette semaine, un événement a particulièrement marqué les esprits."],
};

const SUBJECTS = ["Marie","Thomas","la chercheuse","le jeune homme","mon ami","notre voisine","l'étudiant","Camille"];

/* Build a natural-sounding filler sentence that contains a target word,
   without looking like a word-list. */
function sentenceFor(word, topic) {
  const templates = [
    `On en parle souvent, surtout quand il s'agit de ${word}.`,
    `Pour beaucoup, le mot ${word} évoque quelque chose de familier.`,
    `Il a fallu du temps pour vraiment comprendre ce que signifie ${word}.`,
    `Ce détail, ${word}, change complètement la façon de voir les choses.`,
    `Personne ne s'attendait à ce que ${word} joue un rôle aussi important.`,
    `C'est un sujet qui revient souvent : ${word}.`,
    `Beaucoup de gens associent cela directement à ${word}.`,
    `Il suffit d'y penser un instant pour comprendre ${word}.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/* Level-based sentence complexity/length control */
const LEVEL_SENTENCE_COUNT = { A1: 5, A2: 6, B1: 8, B2: 9, C1: 10, C2: 11 };

/* ============================================================================
   PRONUNCIATION PROFILE — persistent memory
   ========================================================================= */
const DEFAULT_PROFILE = () => ({
  streak: 0,
  lastPracticeDate: null,
  overallScore: null,
  scoreHistory: [], // [{date, score}]
  categories: Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, {
    accuracyHistory: [], // last N accuracy %
    errorCount: 0,
    successStreak: 0,
    lastSeenSession: 0,
    priority: 1, // spaced repetition priority, higher = practice sooner
    trend: "new", // improving | declining | stable | new
  }])),
  wordErrors: {}, // word -> count
  sessionCount: 0,
  history: [], // full session records
});

/* ============================================================================
   ANALYSIS LAYER — the ONLY module a real speech API would replace.
   Clearly isolated per spec #16.
   ========================================================================= */
function analyzeRecording({ passageData, profile, hasRecording }) {
  // Contract for a real implementation:
  // input: audio blob + passageData.text
  // output: { overallScore, categoryScores: {cat: 0-100}, wordResults: [{word, category, correct}], transcriptConfidence }
  if (!hasRecording) return null;

  const categoryScores = {};
  const wordResults = [];

  passageData.targetWords.forEach(({ word, category }) => {
    const hist = profile.categories[category]?.accuracyHistory || [];
    const priorAvg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 65;
    // Simulated: regress toward prior average with slight improvement bias + noise.
    // THIS DOES NOT REFLECT THE ACTUAL AUDIO CONTENT.
    const simulated = Math.max(30, Math.min(98, Math.round(priorAvg + 3 + (Math.random() * 20 - 10))));
    wordResults.push({ word, category, score: simulated, correct: simulated >= 70 });
  });

  Object.keys(CATEGORIES).forEach(cat => {
    const wordsInCat = wordResults.filter(w => w.category === cat);
    if (wordsInCat.length) {
      categoryScores[cat] = Math.round(wordsInCat.reduce((a, w) => a + w.score, 0) / wordsInCat.length);
    }
  });

  const overallScore = Math.round(
    wordResults.reduce((a, w) => a + w.score, 0) / Math.max(1, wordResults.length)
  );

  return { overallScore, categoryScores, wordResults, simulated: true };
}

/* ============================================================================
   ADAPTIVE TEXT GENERATION
   ========================================================================= */
function computePriorities(profile) {
  return Object.entries(profile.categories).map(([cat, data]) => {
    const recencyGap = profile.sessionCount - data.lastSeenSession;
    let priority = data.priority;
    if (data.trend === "declining") priority *= 1.5;
    if (data.successStreak >= 3) priority *= 0.6;
    if (recencyGap > 4) priority *= 1.2;
    return { cat, priority };
  }).sort((a, b) => b.priority - a.priority);
}

function generatePassage({ level, topicInput, isCustomTopic, profile }) {
  const topic = isCustomTopic ? topicInput.trim() : topicInput;
  const displayTopic = topic || "Random";
  const bankTopic = isCustomTopic
    ? TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)] // pick a rotation bucket for sentence style
    : (topic === "Random" ? PREDEFINED_TOPICS[Math.floor(Math.random() * (PREDEFINED_TOPICS.length - 2))] : topic);

  const openerKey = OPENERS[bankTopic] ? bankTopic : "Daily Life";
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const sentenceCount = LEVEL_SENTENCE_COUNT[level] || 8;

  const priorities = computePriorities(profile);
  const targetCategoryCount = Math.max(3, Math.ceil(sentenceCount * 0.7));
  const generalCategoryCount = sentenceCount - targetCategoryCount;

  const topWeak = priorities.slice(0, 3).map(p => p.cat);
  const others = Object.keys(CATEGORIES).filter(c => !topWeak.includes(c));

  const targetWords = [];
  const sentences = [];

  // Opening sentence anchors the topic
  const opener = OPENERS[openerKey][Math.floor(Math.random() * OPENERS[openerKey].length)].replace("{subject}", subject);
  sentences.push(opener);

  // 70%: sentences built around weak categories
  for (let i = 0; i < targetCategoryCount; i++) {
    const cat = topWeak[i % topWeak.length];
    const words = WORD_BANK[cat];
    const word = words[Math.floor(Math.random() * words.length)];
    targetWords.push({ word, category: cat });
    sentences.push(sentenceFor(word, bankTopic));
  }

  // 30%: general categories for balance
  for (let i = 0; i < generalCategoryCount; i++) {
    const cat = others[Math.floor(Math.random() * others.length)];
    const words = WORD_BANK[cat];
    const word = words[Math.floor(Math.random() * words.length)];
    targetWords.push({ word, category: cat });
    sentences.push(sentenceFor(word, bankTopic));
  }

  // Shuffle non-opener sentences slightly for natural flow
  const body = sentences.slice(1);
  for (let i = body.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [body[i], body[j]] = [body[j], body[i]];
  }

  const fullText = [opener, ...body].join(" ");

  return {
    text: fullText,
    level,
    topic: displayTopic,
    targetWords,
    wordCount: fullText.split(/\s+/).length,
  };
}

/* ============================================================================
   PROFILE UPDATE LOGIC (spaced repetition + trend tracking)
   ========================================================================= */
function updateProfileWithResults(profile, analysis, passageData) {
  const next = JSON.parse(JSON.stringify(profile));
  next.sessionCount += 1;

  const today = new Date().toISOString().split("T")[0];
  if (next.lastPracticeDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    next.streak = next.lastPracticeDate === yesterday ? next.streak + 1 : 1;
  }
  next.lastPracticeDate = today;

  next.overallScore = analysis.overallScore;
  next.scoreHistory.push({ date: today, score: analysis.overallScore });
  if (next.scoreHistory.length > 20) next.scoreHistory.shift();

  Object.entries(analysis.categoryScores).forEach(([cat, score]) => {
    const catData = next.categories[cat];
    catData.accuracyHistory.push(score);
    if (catData.accuracyHistory.length > 10) catData.accuracyHistory.shift();
    catData.lastSeenSession = next.sessionCount;

    const prevAvg = catData.accuracyHistory.length > 1
      ? catData.accuracyHistory.slice(0, -1).reduce((a, b) => a + b, 0) / (catData.accuracyHistory.length - 1)
      : score;
    catData.trend = score > prevAvg + 3 ? "improving" : score < prevAvg - 3 ? "declining" : "stable";

    if (score >= 75) {
      catData.successStreak += 1;
      catData.errorCount = Math.max(0, catData.errorCount - 1);
    } else {
      catData.successStreak = 0;
      catData.errorCount += 1;
    }
    catData.priority = Math.max(0.3, Math.min(3, 1 + catData.errorCount * 0.3 - catData.successStreak * 0.15));
  });

  analysis.wordResults.forEach(w => {
    if (!w.correct) {
      next.wordErrors[w.word] = (next.wordErrors[w.word] || 0) + 1;
    }
  });

  next.history.unshift({
    date: today,
    topic: passageData.topic,
    level: passageData.level,
    score: analysis.overallScore,
    weaknesses: Object.entries(analysis.categoryScores).filter(([, s]) => s < 70).map(([c]) => c),
    text: passageData.text,
    wordResults: analysis.wordResults,
  });
  if (next.history.length > 50) next.history.pop();

  return next;
}

/* ============================================================================
   STORAGE
   Uses browser localStorage — persists per-device, per-browser.
   ========================================================================= */
const STORAGE_KEY = "fr_pronunciation_profile";

async function persistProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) { console.error("save failed", e); }
}
async function fetchProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* no existing profile */ }
  return null;
}

/* ============================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
function TrendIcon({ trend }) {
  if (trend === "improving") return <TrendingUp size={15} color={C.green} />;
  if (trend === "declining") return <TrendingDown size={15} color={C.red} />;
  return <Minus size={15} color={C.gray} />;
}

function SeverityDot({ score }) {
  const color = score >= 75 ? C.green : score >= 55 ? C.amber : C.red;
  return <span style={{ width: 9, height: 9, borderRadius: 99, background: color, display: "inline-block", flexShrink: 0 }} />;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.grayLine}`,
      borderRadius: 20,
      padding: 20,
      ...style,
    }}>{children}</div>
  );
}

/* ============================================================================
   PRACTICE SCREEN — level/topic selection
   ========================================================================= */
function PracticeSetup({ profile, onGenerate }) {
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  const weakest = computePriorities(profile).slice(0, 2).filter(p => profile.categories[p.cat].accuracyHistory.length > 0);

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.amber, fontWeight: 600, fontSize: 15 }}>
          <Flame size={18} fill={C.amber} strokeWidth={0} />
          {profile.streak > 0 ? `${profile.streak} day streak` : "Start your streak today"}
        </div>
      </div>

      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: C.navy, margin: "0 0 6px", fontWeight: 600 }}>
        New practice
      </h1>
      <p style={{ color: C.navySoft, fontSize: 15, margin: "0 0 28px", lineHeight: 1.5 }}>
        Choose a level and a topic. The passage will target your current weak sounds automatically.
      </p>

      {weakest.length > 0 && (
        <Card style={{ background: C.blueSoft, border: "none", marginBottom: 24, padding: 16 }}>
          <div style={{ fontSize: 13, color: C.navySoft, marginBottom: 6 }}>Today's focus, based on your history</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {weakest.map(w => (
              <span key={w.cat} style={{ background: C.bg, color: C.navy, fontSize: 13, padding: "5px 12px", borderRadius: 99, fontWeight: 500 }}>
                {CATEGORIES[w.cat].label}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Level</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{
              padding: "12px 0",
              borderRadius: 12,
              border: level === l ? `2px solid ${C.blue}` : `1px solid ${C.grayLine}`,
              background: level === l ? C.blueSoft : C.bg,
              color: level === l ? C.blue : C.navySoft,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all .15s ease",
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Topic</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {PREDEFINED_TOPICS.map(t => (
            <button key={t} onClick={() => { setTopic(t); setCustomMode(false); }} style={{
              padding: "13px 14px",
              borderRadius: 14,
              border: topic === t && !customMode ? `2px solid ${C.blue}` : `1px solid ${C.grayLine}`,
              background: topic === t && !customMode ? C.blueSoft : C.bg,
              color: topic === t && !customMode ? C.blue : C.navySoft,
              fontWeight: 500,
              fontSize: 14,
              textAlign: "left",
              cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        <button onClick={() => setCustomMode(true)} style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 14,
          border: customMode ? `2px solid ${C.blue}` : `1.5px dashed ${C.blue}`,
          background: customMode ? C.blueSoft : C.bg,
          color: C.blue,
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          textAlign: "left",
        }}>
          ✎ Write your own topic
        </button>

        {customMode && (
          <div style={{ marginTop: 12 }}>
            <input
              autoFocus
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Black holes, Ancient Rome, how airplanes fly…"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: `1.5px solid ${C.blueLine}`,
                fontSize: 15,
                color: C.navy,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12.5, color: C.gray, marginTop: 8, lineHeight: 1.6 }}>
              Type in English, French, or any language — examples: "Neuroscience", "Climate change", "Paris"
            </div>
          </div>
        )}
      </div>

      <button
        disabled={!topic && !(customMode && customTopic.trim())}
        onClick={() => onGenerate({ level, topicInput: customMode ? customTopic : topic, isCustomTopic: customMode })}
        style={{
          width: "100%",
          padding: "17px 0",
          borderRadius: 16,
          border: "none",
          background: (!topic && !(customMode && customTopic.trim())) ? C.grayLine : C.blue,
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: (!topic && !(customMode && customTopic.trim())) ? "default" : "pointer",
          marginTop: 8,
        }}
      >
        Generate text
      </button>
    </div>
  );
}

/* ============================================================================
   READING / RECORDING SCREEN
   ========================================================================= */
function ReadingScreen({ passageData, profile, onComplete, onBack }) {
  const [recordingState, setRecordingState] = useState("idle"); // idle | recording | recorded
  const [audioURL, setAudioURL] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e) {
      setMicError("Microphone access was denied or unavailable. Check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    setRecordingState("recorded");
  };

  const recordAgain = () => {
    setAudioURL(null);
    setRecordingState("idle");
    setSeconds(0);
  };

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Render passage with target words subtly underlined
  const renderText = () => {
    const uniqueWords = [...new Set(passageData.targetWords.map(w => w.word))];
    const wordSet = new Set(uniqueWords.map(w => w.toLowerCase()));
    const tokens = passageData.text.split(/(\s+)/);
    return tokens.map((tok, i) => {
      const clean = tok.toLowerCase().replace(/[.,!?;:]/g, "");
      const isTarget = wordSet.has(clean);
      if (isTarget) {
        return <span key={i} style={{ borderBottom: `2px solid ${C.blueLine}` }}>{tok}</span>;
      }
      return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
  };

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.navySoft, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 4, fontSize: 14 }}>
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.amber, fontWeight: 600, fontSize: 14 }}>
          <Flame size={16} fill={C.amber} strokeWidth={0} />
          {profile.streak} day streak
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 99, background: recordingState === "recording" ? C.red : C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
          boxShadow: recordingState === "recording" ? `0 0 0 8px ${C.redSoft}` : `0 0 0 8px ${C.blueSoft}`,
          transition: "all .2s ease",
        }}>
          {recordingState === "recording" ? <Square size={28} color="#fff" fill="#fff" /> : <Mic size={32} color="#fff" />}
        </div>
        {recordingState === "recording" && (
          <div style={{ marginTop: 12, color: C.red, fontWeight: 600, fontSize: 14 }}>
            ● Recording… {fmtTime(seconds)}
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: C.blue, fontWeight: 600, background: C.blueSoft, padding: "4px 10px", borderRadius: 8 }}>
            {passageData.level}
          </span>
          <span style={{ fontSize: 12.5, color: C.gray }}>{passageData.topic} · {passageData.wordCount} words</span>
        </div>
        <p style={{
          fontFamily: "Fraunces, serif", fontSize: 19, lineHeight: 1.85, color: C.navy, margin: 0,
        }}>
          {renderText()}
        </p>
      </Card>

      {micError && (
        <Card style={{ background: C.redSoft, border: "none", marginBottom: 16 }}>
          <span style={{ color: C.red, fontSize: 14 }}>{micError}</span>
        </Card>
      )}

      {recordingState === "idle" && (
        <button onClick={startRecording} style={{
          width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
          background: C.blue, color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer",
        }}>
          Start recording
        </button>
      )}

      {recordingState === "recording" && (
        <button onClick={stopRecording} style={{
          width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
          background: C.red, color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer",
        }}>
          Stop
        </button>
      )}

      {recordingState === "recorded" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <button onClick={() => new Audio(audioURL).play()} style={{
              flex: 1, padding: "14px 0", borderRadius: 14, border: `1.5px solid ${C.blue}`,
              background: C.bg, color: C.blue, fontWeight: 600, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Play size={17} /> Replay
            </button>
            <button onClick={recordAgain} style={{
              flex: 1, padding: "14px 0", borderRadius: 14, border: `1px solid ${C.grayLine}`,
              background: C.bg, color: C.navySoft, fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}>
              Record again
            </button>
          </div>
          <button onClick={() => onComplete(true)} style={{
            width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
            background: C.navy, color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer",
          }}>
            Analyze pronunciation
          </button>
        </div>
      )}

      {recordingState === "idle" && (
        <button onClick={() => onComplete(false)} style={{
          width: "100%", padding: "12px 0", marginTop: 10, borderRadius: 14, border: "none",
          background: "transparent", color: C.gray, fontWeight: 500, fontSize: 13.5, cursor: "pointer",
        }}>
          Skip recording (no analysis available)
        </button>
      )}
    </div>
  );
}

/* ============================================================================
   RESULTS SCREEN
   ========================================================================= */
function ResultsScreen({ analysis, passageData, profile, onNext, onHome }) {
  if (!analysis) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎙️</div>
        <h2 style={{ fontFamily: "Fraunces, serif", color: C.navy, fontSize: 22 }}>No recording to analyze</h2>
        <p style={{ color: C.navySoft, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          I don't have audio from this session, so I won't guess at a score. Record yourself next time for real feedback.
        </p>
        <button onClick={onHome} style={{
          padding: "14px 32px", borderRadius: 14, border: "none", background: C.blue, color: "#fff",
          fontWeight: 600, fontSize: 15, cursor: "pointer",
        }}>Back to practice</button>
      </div>
    );
  }

  const strengths = Object.entries(analysis.categoryScores).filter(([, s]) => s >= 80);
  const weaknesses = Object.entries(analysis.categoryScores).filter(([, s]) => s < 75).sort((a, b) => a[1] - b[1]);
  const errorWords = analysis.wordResults.filter(w => !w.correct);

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{
        background: C.navy, borderRadius: 24, padding: "28px 24px", textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ color: "#B9C4DC", fontSize: 13.5, marginBottom: 8, letterSpacing: 0.2 }}>Pronunciation score</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 52, color: "#fff", fontWeight: 600, lineHeight: 1 }}>
          {analysis.overallScore}<span style={{ fontSize: 22, color: "#8FA0C4" }}>/100</span>
        </div>
      </div>

      <Card style={{ background: C.amberSoft, border: "none", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#8A6116", lineHeight: 1.6 }}>
          <strong>Simulated analysis.</strong> No real speech-recognition API is connected in this build — scores here are generated from your practice history, not your actual audio. See Settings for how to connect a real pronunciation API.
        </div>
      </Card>

      {strengths.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Your strengths</div>
          {strengths.map(([cat, score]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <Check size={17} color={C.green} />
              <span style={{ fontSize: 14.5, color: C.navySoft }}>{CATEGORIES[cat].label} — {score}%</span>
            </div>
          ))}
        </div>
      )}

      {weaknesses.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Practice these</div>
          {weaknesses.map(([cat, score]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <SeverityDot score={score} />
              <span style={{ fontSize: 14.5, color: C.navySoft }}>{CATEGORIES[cat].label} — {score}%</span>
            </div>
          ))}
        </div>
      )}

      {errorWords.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Word by word</div>
          {errorWords.slice(0, 6).map((w, i) => (
            <Card key={i} style={{ marginBottom: 10, borderLeft: `3px solid ${C.red}`, borderRadius: 14 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 17, color: C.navy, marginBottom: 6 }}>{w.word}</div>
              <div style={{ fontSize: 13.5, color: C.navySoft, lineHeight: 1.7 }}>
                <strong style={{ color: C.navy }}>Problem:</strong> {CATEGORIES[w.category].label} {CATEGORIES[w.category].ipa}<br />
                <strong style={{ color: C.navy }}>Tip:</strong> {CATEGORIES[w.category].tip}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onHome} style={{
          flex: 1, padding: "15px 0", borderRadius: 14, border: `1px solid ${C.grayLine}`,
          background: C.bg, color: C.navySoft, fontWeight: 600, fontSize: 15, cursor: "pointer",
        }}>Done</button>
        <button onClick={onNext} style={{
          flex: 1, padding: "15px 0", borderRadius: 14, border: "none",
          background: C.blue, color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer",
        }}>Next passage</button>
      </div>
    </div>
  );
}

/* ============================================================================
   PROGRESS SCREEN
   ========================================================================= */
function ProgressScreen({ profile }) {
  const catEntries = Object.entries(profile.categories).filter(([, d]) => d.accuracyHistory.length > 0);
  const strongest = [...catEntries].sort((a, b) => {
    const avgA = a[1].accuracyHistory.reduce((x, y) => x + y, 0) / a[1].accuracyHistory.length;
    const avgB = b[1].accuracyHistory.reduce((x, y) => x + y, 0) / b[1].accuracyHistory.length;
    return avgB - avgA;
  }).slice(0, 3);
  const weakest = [...catEntries].sort((a, b) => {
    const avgA = a[1].accuracyHistory.reduce((x, y) => x + y, 0) / a[1].accuracyHistory.length;
    const avgB = b[1].accuracyHistory.reduce((x, y) => x + y, 0) / b[1].accuracyHistory.length;
    return avgA - avgB;
  }).slice(0, 3);

  const topWords = Object.entries(profile.wordErrors).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const maxScore = 100;
  const chartW = 300, chartH = 120;
  const points = profile.scoreHistory.map((h, i) => {
    const x = profile.scoreHistory.length > 1 ? (i / (profile.scoreHistory.length - 1)) * chartW : chartW / 2;
    const y = chartH - (h.score / maxScore) * chartH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: C.navy, margin: "0 0 20px", fontWeight: 600 }}>Progress</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <Flame size={22} fill={C.amber} strokeWidth={0} style={{ marginBottom: 6 }} />
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: C.navy, fontWeight: 600 }}>{profile.streak}</div>
          <div style={{ fontSize: 12.5, color: C.gray }}>day streak</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: C.navy, fontWeight: 600, marginTop: 4 }}>
            {profile.overallScore ?? "—"}
          </div>
          <div style={{ fontSize: 12.5, color: C.gray }}>overall score</div>
        </Card>
      </div>

      {profile.scoreHistory.length >= 2 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 14 }}>Score over time</div>
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline points={points} fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {profile.scoreHistory.map((h, i) => {
              const x = profile.scoreHistory.length > 1 ? (i / (profile.scoreHistory.length - 1)) * chartW : chartW / 2;
              const y = chartH - (h.score / maxScore) * chartH;
              return <circle key={i} cx={x} cy={y} r="3.5" fill={C.blue} />;
            })}
          </svg>
        </Card>
      )}

      {catEntries.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: C.gray, fontSize: 14 }}>Complete a few practice sessions to see your sound-by-sound progress here.</p>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Strongest sounds</div>
            {strongest.map(([cat, d]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.grayLine}` }}>
                <span style={{ fontSize: 14, color: C.navySoft }}>{CATEGORIES[cat].label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendIcon trend={d.trend} />
                  <span style={{ fontSize: 13.5, color: C.navy, fontWeight: 600 }}>{d.accuracyHistory[d.accuracyHistory.length - 1]}%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Sounds to practice</div>
            {weakest.map(([cat, d]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.navySoft }}>{CATEGORIES[cat].label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TrendIcon trend={d.trend} />
                    <span style={{ fontSize: 13.5, color: C.navy, fontWeight: 600 }}>{d.accuracyHistory[d.accuracyHistory.length - 1]}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>
                  {d.accuracyHistory.slice(-4).join("% → ")}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {topWords.length > 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Frequently mispronounced words</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {topWords.map(([word, count]) => (
              <span key={word} style={{ background: C.redSoft, color: C.red, fontSize: 13, padding: "6px 12px", borderRadius: 99, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>
                {word} · {count}×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   HISTORY SCREEN
   ========================================================================= */
function HistoryScreen({ profile }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (profile.history.length === 0) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: C.gray, fontSize: 14 }}>No sessions yet. Your practice history will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: C.navy, margin: "0 0 20px", fontWeight: 600 }}>History</h1>
      {profile.history.map((s, i) => (
        <Card key={i} style={{ marginBottom: 12, cursor: "pointer" }}>
          <div onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{s.topic}</div>
              <div style={{ fontSize: 12.5, color: C.gray, marginTop: 3 }}>{s.date} · {s.level}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17,
                color: s.score >= 75 ? C.green : s.score >= 55 ? C.amber : C.red,
              }}>{s.score}</span>
              <ChevronRight size={17} color={C.gray} style={{ transform: openIdx === i ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </div>
          </div>
          {openIdx === i && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.grayLine}` }}>
              <p style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: C.navySoft, lineHeight: 1.7, marginBottom: 12 }}>{s.text}</p>
              {s.weaknesses.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.weaknesses.map(w => (
                    <span key={w} style={{ fontSize: 12, background: C.redSoft, color: C.red, padding: "4px 10px", borderRadius: 99 }}>{CATEGORIES[w].label}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ============================================================================
   SETTINGS SCREEN
   ========================================================================= */
function SettingsScreen({ profile, onReset }) {
  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: C.navy, margin: "0 0 20px", fontWeight: 600 }}>Settings</h1>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.navy, marginBottom: 8 }}>About analysis</div>
        <p style={{ fontSize: 13.5, color: C.navySoft, lineHeight: 1.7, margin: 0 }}>
          This build simulates pronunciation scoring from your practice history — it does not process real audio content. The analysis logic lives in a single isolated function (<code>analyzeRecording</code>) so a real speech API (e.g. Azure Pronunciation Assessment, Google Speech-to-Text) can be connected later without changing the rest of the app.
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Your data</div>
        <p style={{ fontSize: 13.5, color: C.navySoft, lineHeight: 1.7, margin: "0 0 14px" }}>
          {profile.sessionCount} session{profile.sessionCount !== 1 ? "s" : ""} recorded. Stored locally to this app.
        </p>
        <button onClick={onReset} style={{
          padding: "10px 18px", borderRadius: 10, border: `1px solid ${C.red}`, background: "#fff",
          color: C.red, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
        }}>Reset all progress</button>
      </Card>
    </div>
  );
}

/* ============================================================================
   BOTTOM NAV
   ========================================================================= */
function BottomNav({ active, onChange }) {
  const items = [
    { key: "practice", icon: Home, label: "Practice" },
    { key: "progress", icon: BarChart3, label: "Progress" },
    { key: "history", icon: History, label: "History" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
      borderTop: `1px solid ${C.grayLine}`, display: "flex", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
      maxWidth: 480, margin: "0 auto",
    }}>
      {items.map(({ key, icon: Icon, label }) => (
        <button key={key} onClick={() => onChange(key)} style={{
          flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, padding: "6px 0", cursor: "pointer",
        }}>
          <Icon size={21} color={active === key ? C.blue : C.gray} strokeWidth={active === key ? 2.4 : 2} />
          <span style={{ fontSize: 11, color: active === key ? C.blue : C.gray, fontWeight: active === key ? 600 : 500 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================================
   ROOT APP
   ========================================================================= */
function App() {
  const [tab, setTab] = useState("practice");
  const [flow, setFlow] = useState("setup"); // setup | reading | results
  const [profile, setProfile] = useState(DEFAULT_PROFILE());
  const [loading, setLoading] = useState(true);
  const [passageData, setPassageData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await fetchProfile();
      if (saved) setProfile(saved);
      setLoading(false);
    })();
  }, []);

  const handleGenerate = ({ level, topicInput, isCustomTopic }) => {
    const data = generatePassage({ level, topicInput, isCustomTopic, profile });
    setPassageData(data);
    setFlow("reading");
  };

  const handleReadingComplete = (hasRecording) => {
    const result = analyzeRecording({ passageData, profile, hasRecording });
    setAnalysis(result);
    if (result) {
      const updated = updateProfileWithResults(profile, result, passageData);
      setProfile(updated);
      persistProfile(updated);
    }
    setFlow("results");
  };

  const goHome = () => { setFlow("setup"); setTab("practice"); };
  const goNext = () => { setFlow("setup"); };

  const resetProgress = async () => {
    const fresh = DEFAULT_PROFILE();
    setProfile(fresh);
    await persistProfile(fresh);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ color: C.gray, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  let content;
  if (tab === "practice") {
    if (flow === "setup") content = <PracticeSetup profile={profile} onGenerate={handleGenerate} />;
    else if (flow === "reading") content = <ReadingScreen passageData={passageData} profile={profile} onComplete={handleReadingComplete} onBack={() => setFlow("setup")} />;
    else if (flow === "results") content = <ResultsScreen analysis={analysis} passageData={passageData} profile={profile} onNext={goNext} onHome={goHome} />;
  } else if (tab === "progress") {
    content = <ProgressScreen profile={profile} />;
  } else if (tab === "history") {
    content = <HistoryScreen profile={profile} />;
  } else if (tab === "settings") {
    content = <SettingsScreen profile={profile} onReset={resetProgress} />;
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "Inter, sans-serif",
      maxWidth: 480, margin: "0 auto", position: "relative",
    }}>
      {content}
      <BottomNav active={tab} onChange={(k) => { setTab(k); if (k === "practice") setFlow("setup"); }} />
    </div>
  );
}

export default App;
