import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTest } from "../contexts/TestContext";
import { useTheme } from "../contexts/ThemeContext";
import { FaClock, FaBookOpen, FaMoon, FaSun } from "react-icons/fa";
import "../styles/TestPage.css";

const TestPage = () => {
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const {
    currentTest,
    submitAnswer,
    finishTest,
    startTest,
    setCurrentTest,
    isLoadingTests,
  } = useTest();
  const { theme, toggleTheme } = useTheme();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Wait for tests to load from Firestore before starting
    if (isLoadingTests) return;
    if (!currentTest) {
      const testStarted = startTest(difficulty);
      if (!testStarted) {
        navigate("/test-selection");
        return;
      }
    }
  }, [difficulty, startTest, navigate, isLoadingTests, currentTest]);

  useEffect(() => {
    if (currentTest && currentTest.currentQuestionIndex === 0) {
      // Set timer for each question (30 seconds)
      setTimeLeft(30);
    }
  }, [currentTest]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up, auto-submit
          handleSubmitAnswer(selectedAnswer || "");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswer]);

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

    // Submit answer immediately when submit button is clicked
    submitAnswer(answer);
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // For the last question, just finish the test
      // Answer is already submitted in handleSubmitAnswer
      finishTest();
      navigate("/result");
    } else {
      // For other questions, just move to next
      // Answer is already submitted in handleSubmitAnswer
      setCurrentTest((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(30);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
              <span>{decodeURIComponent(difficulty)}</span>
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
