import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTest } from "../contexts/TestContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { FaClock, FaBookOpen, FaMoon, FaSun, FaLock, FaExpand } from "react-icons/fa";
import {
  useAntiCheat,
  enterFullscreen,
  exitFullscreen,
  isFullscreenSupported,
} from "./useAntiCheat";
import "../styles/TestPage.css";

const QUESTION_SECONDS = 30;

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const centerCard = {
  maxWidth: 520,
  margin: "12vh auto 0",
  padding: "2.5rem 2rem",
  textAlign: "center",
  borderRadius: 24,
  background: "rgba(24, 24, 36, 0.92)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.15)",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
  position: "relative",
  zIndex: 2,
};

const bigBtn = (bg) => ({
  marginTop: "1.5rem",
  padding: "14px 28px",
  borderRadius: 14,
  border: "none",
  background: bg,
  color: "white",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
});

const TestPage = () => {
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const {
    currentTest,
    submitAnswer,
    finishTest,
    startTest,
    setCurrentTest,
    resetTest,
    isLoadingTests,
  } = useTest();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  const topicName = safeDecode(difficulty);
  const uid = currentUser?.uid || "";
  const lockKey = `test_lock_${uid || "anon"}_${topicName}`;

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);

  const [started, setStarted] = useState(false); // fullscreen'da boshlandimi
  const [fsError, setFsError] = useState("");
  const [locked, setLocked] = useState(null); // { reason } | null
  const [checkingLock, setCheckingLock] = useState(true);

  const startedAtRef = useRef(0);
  const testRef = useRef(null);
  const selectedRef = useRef(null);
  testRef.current = currentTest;
  selectedRef.current = selectedAnswer;

  // ---------- Avvalgi blokni tekshirish (sahifani yangilab aylanib o'tmasligi uchun) ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const localLocked = !!localStorage.getItem(lockKey);
      let isLocked = localLocked;
      try {
        if (uid) {
          const snap = await getDocs(
            query(collection(db, "cheatingReports"), where("uid", "==", uid))
          );
          const mine = snap.docs
            .map((d) => d.data())
            .filter((r) => r.topicName === topicName);
          if (mine.length > 0) {
            // Bazadagi holat ustun: admin ruxsat bergan bo'lsa blok olinadi
            isLocked = mine.some((r) => !r.unlocked);
            if (isLocked) localStorage.setItem(lockKey, "1");
            else localStorage.removeItem(lockKey);
          }
        }
      } catch (err) {
        console.warn("Blok holatini tekshirib bo'lmadi:", err);
      }
      if (!cancelled) {
        if (isLocked) {
          setLocked({ reason: "Avvalgi urinishda qoidabuzarlik aniqlangan" });
        }
        setCheckingLock(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lockKey, uid, topicName]);

  // ---------- Testni yuklash ----------
  useEffect(() => {
    if (isLoadingTests) return;
    if (!currentTest) {
      const testStarted = startTest(difficulty);
      if (!testStarted) {
        navigate("/test-selection");
        return;
      }
    }
  }, [difficulty, startTest, navigate, isLoadingTests, currentTest]);

  // ---------- Firibgarlik: bloklash va adminga yuborish ----------
  const handleViolation = async (reason) => {
    const t = testRef.current;
    const answers = t?.answers || [];
    const correctCount = answers.filter(
      (a, i) => t?.questions?.[i] && a === t.questions[i].correctAnswer
    ).length;

    setLocked({ reason });
    localStorage.setItem(lockKey, "1");
    exitFullscreen();

    const studentName =
      [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
      currentUser?.username ||
      "Noma'lum o'quvchi";

    try {
      await addDoc(collection(db, "cheatingReports"), {
        uid,
        studentName,
        studentEmail: currentUser?.email || "",
        topicName,
        reason,
        solvedCount: answers.length,
        correctCount,
        totalQuestions: t?.questions?.length || 0,
        currentQuestionNumber: (t?.currentQuestionIndex ?? 0) + 1,
        timeSpentMs: startedAtRef.current ? Date.now() - startedAtRef.current : 0,
        createdAtMs: Date.now(),
        createdDateStr: new Date().toLocaleString("uz-UZ"),
        unlocked: false,
      });
    } catch (err) {
      console.error("Firibgarlik hisobotini yuborib bo'lmadi:", err);
    }
  };

  const { disarm } = useAntiCheat({
    enabled: started && !locked,
    onViolation: handleViolation,
  });

  // Sahifadan chiqib ketsa fullscreen'dan ham chiqamiz
  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  const handleStartFullscreen = async () => {
    setFsError("");
    if (!isFullscreenSupported()) {
      setFsError(
        "Bu qurilma/brauzer to'liq ekran rejimini qo'llab-quvvatlamaydi. Kompyuterda Chrome, Edge yoki Firefox'dan foydalaning."
      );
      return;
    }
    try {
      await enterFullscreen();
      startedAtRef.current = Date.now();
      setTimeLeft(QUESTION_SECONDS);
      setStarted(true);
    } catch (err) {
      setFsError("To'liq ekranga o'tib bo'lmadi. Qaytadan urinib ko'ring.");
    }
  };

  // ---------- Taymer ----------
  useEffect(() => {
    if (!started || locked || showAnswer || !currentTest) return;
    const id = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [started, locked, showAnswer, !!currentTest]);

  useEffect(() => {
    if (started && !locked && !showAnswer && currentTest && timeLeft <= 0) {
      // Vaqt tugadi: tanlangan javobni (bo'lmasa bo'sh) yuboramiz
      submitAnswer(selectedRef.current || "");
      setShowAnswer(true);
    }
  }, [timeLeft]);

  // ---------- Ekranlar ----------
  if (checkingLock) {
    return (
      <div className="test-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="test-page-container">
        <div style={centerCard}>
          <div style={{ fontSize: "3rem", color: "#ef4444" }}>
            <FaLock />
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem" }}>Test bloklandi</h2>
          <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
            Test paytida qoidabuzarlik aniqlandi va admin xabardor qilindi.
            Testni davom ettirish uchun admin ruxsat berishi kerak.
          </p>
          <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>Sabab: {locked.reason}</p>
          <button
            style={bigBtn("linear-gradient(135deg, #6366f1, #8b5cf6)")}
            onClick={() => {
              resetTest?.();
              navigate("/");
            }}
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (!currentTest) {
    return (
      <div className="test-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="test-page-container">
        <div style={centerCard}>
          <div style={{ fontSize: "3rem", color: "#8b5cf6" }}>
            <FaExpand />
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem" }}>{topicName}</h2>
          <p style={{ opacity: 0.8, lineHeight: 1.6, textAlign: "left" }}>
            Test <strong>to'liq ekran</strong> rejimida o'tadi. Quyidagilar{" "}
            <strong>qoidabuzarlik</strong> hisoblanadi va test darhol
            bloklanib, admin xabardor qilinadi:
          </p>
          <ul style={{ textAlign: "left", opacity: 0.8, lineHeight: 1.7, paddingLeft: "1.2rem" }}>
            <li>To'liq ekrandan chiqish (Esc, F11)</li>
            <li>Boshqa oyna/tabga o'tish (Alt+Tab, Win tugmasi)</li>
            <li>Ctrl+Shift kombinatsiyalari, F12</li>
          </ul>
          {fsError && <p style={{ color: "#f87171" }}>{fsError}</p>}
          <button
            style={bigBtn("linear-gradient(135deg, #10b981, #059669)")}
            onClick={handleStartFullscreen}
          >
            To'liq ekranda boshlash
          </button>
          <div>
            <button
              style={{ ...bigBtn("transparent"), marginTop: "0.8rem", opacity: 0.7 }}
              onClick={() => navigate("/test-selection")}
            >
              Orqaga
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion =
    currentTest.questions[currentTest.currentQuestionIndex];
  const isLastQuestion =
    currentTest.currentQuestionIndex === currentTest.questions.length - 1;
  const progress =
    ((currentTest.currentQuestionIndex + 1) / currentTest.questions.length) *
    100;

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setShowAnswer(false);
  };

  const handleSubmitAnswer = (answer) => {
    if (!answer) return;
    submitAnswer(answer);
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Testni qasddan tugatyapmiz: avval nazoratni o'chiramiz, keyin fullscreen'dan chiqamiz
      disarm();
      finishTest();
      exitFullscreen();
      navigate("/result");
    } else {
      setCurrentTest((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(QUESTION_SECONDS);
    }
  };

  const formatTime = (seconds) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnswerClass = (answer) => {
    if (!showAnswer) return "";
    if (answer === currentQuestion.correctAnswer) return "correct";
    if (answer === selectedAnswer && answer !== currentQuestion.correctAnswer)
      return "incorrect";
    return "disabled";
  };

  return (
    <div className="test-page-container">
      {/* Background Animation */}
      <div className="test-background">
        <div className="test-shapes">
          <div className="test-shape test-shape-1"></div>
          <div className="test-shape test-shape-2"></div>
          <div className="test-shape test-shape-3"></div>
        </div>
      </div>

      {/* Header */}
      <header className="test-header animate-slide-in-top">
        <div className="test-info">
          <div className="test-progress">
            <span className="progress-text">
              {currentTest.currentQuestionIndex + 1} /{" "}
              {currentTest.questions.length}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="test-stats">
            <div className="stat-item">
              <span className="stat-label">To'g'ri javoblar:</span>
              <span className="stat-value correct-count">
                {
                  currentTest.answers.filter(
                    (answer, index) =>
                      answer === currentTest.questions[index].correctAnswer
                  ).length
                }
              </span>
            </div>
          </div>
        </div>

        <div className="test-controls">
          <div className="timer">
            <span className="timer-icon">
              <FaClock />
            </span>
            <span className="timer-text">{formatTime(timeLeft)}</span>
          </div>

          <button className="theme-toggle-test" onClick={toggleTheme}>
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="test-main animate-fade-in-up">
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-title">
              Savol #{currentTest.currentQuestionIndex + 1}
            </h2>
            <div className="difficulty-badge">
              <FaBookOpen />
              <span>{topicName}</span>
            </div>
          </div>

          <div className="question-content">
            {currentQuestion.imageUrl && (
              <div className="question-image-wrapper" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img
                  src={currentQuestion.imageUrl}
                  alt="Savol rasmi"
                  style={{ maxWidth: "100%", maxHeight: "350px", borderRadius: "16px", border: "2px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)", objectFit: "contain" }}
                />
              </div>
            )}
            <p className="question-text">{currentQuestion.question}</p>
          </div>

          <div className="answers-container">
            {Array.isArray(currentQuestion.options)
              ? currentQuestion.options.map((opt, idx) => (
                  <button
                    key={opt.id || idx}
                    className={`answer-option ${getAnswerClass(opt.text)} ${
                      selectedAnswer === opt.text ? "selected" : ""
                    }`}
                    onClick={() => handleAnswerSelect(opt.text)}
                    disabled={showAnswer}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="option-text">{opt.text}</span>
                    {showAnswer &&
                      opt.text === currentQuestion.correctAnswer && (
                        <span className="correct-icon">✓</span>
                      )}
                    {showAnswer &&
                      opt.text === selectedAnswer &&
                      opt.text !== currentQuestion.correctAnswer && (
                        <span className="incorrect-icon">✗</span>
                      )}
                  </button>
                ))
              : ["A", "B", "C"].map((option, index) => {
                  const answerText =
                    index === 0
                      ? currentQuestion.optionA
                      : index === 1
                      ? currentQuestion.optionB
                      : currentQuestion.optionC;
                  return (
                    <button
                      key={option}
                      className={`answer-option ${getAnswerClass(answerText)} ${
                        selectedAnswer === answerText ? "selected" : ""
                      }`}
                      onClick={() => handleAnswerSelect(answerText)}
                      disabled={showAnswer}
                    >
                      <span className="option-letter">{option}</span>
                      <span className="option-text">{answerText}</span>
                      {showAnswer &&
                        answerText === currentQuestion.correctAnswer && (
                          <span className="correct-icon">✓</span>
                        )}
                      {showAnswer &&
                        answerText === selectedAnswer &&
                        answerText !== currentQuestion.correctAnswer && (
                          <span className="incorrect-icon">✗</span>
                        )}
                    </button>
                  );
                })}
          </div>

          <div className="question-actions">
            {!showAnswer ? (
              <button
                className="submit-answer-btn"
                onClick={() => handleSubmitAnswer(selectedAnswer)}
                disabled={!selectedAnswer}
              >
                Javobni Yuborish
              </button>
            ) : (
              <button
                className="next-question-btn"
                onClick={handleNextQuestion}
              >
                {isLastQuestion ? "Testni Tugatish" : "Keyingi Savol"}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="progress-dots">
          {currentTest.questions.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index < currentTest.currentQuestionIndex
                  ? "completed"
                  : index === currentTest.currentQuestionIndex
                  ? "current"
                  : "pending"
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestPage;
