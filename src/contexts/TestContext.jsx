import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const TestContext = createContext();

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error("useTest must be used within a TestProvider");
  }
  return context;
};

export const TestProvider = ({ children }) => {
  const [tests, setTests] = useState({ easy: [], medium: [], hard: [] });
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  // Real-time Firestore listener — onSnapshot
  useEffect(() => {
    setIsLoadingTests(true);
    const testsRef = collection(db, "questions");
    const q = query(testsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const grouped = { easy: [], medium: [], hard: [] };
        snapshot.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          const diff = ["easy", "medium", "hard"].includes(data.difficulty)
            ? data.difficulty
            : "easy";
          grouped[diff].push(data);
        });
        setTests(grouped);
        setFirestoreError(null);
        setIsLoadingTests(false);
      },
      (error) => {
        console.error("Firestore onSnapshot xatolik:", error.code, error.message);
        setFirestoreError(error.code);
        setIsLoadingTests(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add test — directly saves to Firestore, onSnapshot updates UI automatically
  const addTest = async (test) => {
    const testsRef = collection(db, "questions");
    const hasOptionsArray =
      Array.isArray(test.options) && test.options.length >= 2;

    const payload = hasOptionsArray
      ? {
          question: test.question,
          options: test.options.map((o) => ({
            id: o.id || Math.random().toString(36).slice(2),
            text: o.text,
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer:
            test.correctAnswer ||
            (test.options.find((o) => o.isCorrect)?.text ?? ""),
          difficulty: test.difficulty || "easy",
          createdAt: serverTimestamp(),
        }
      : {
          question: test.question,
          optionA: test.optionA,
          optionB: test.optionB,
          optionC: test.optionC,
          correctAnswer: test.correctAnswer,
          difficulty: test.difficulty || "easy",
          createdAt: serverTimestamp(),
        };

    // Write directly to Firestore — onSnapshot will update UI in real-time
    await addDoc(testsRef, payload);
  };

  // Edit test
  const editTest = async (testId, updatedTest) => {
    const ref = doc(db, "questions", testId);
    const hasOptionsArray =
      Array.isArray(updatedTest.options) && updatedTest.options.length >= 2;

    const payload = hasOptionsArray
      ? {
          question: updatedTest.question,
          options: updatedTest.options.map((o) => ({
            id: o.id || Math.random().toString(36).slice(2),
            text: o.text,
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer:
            updatedTest.correctAnswer ||
            (updatedTest.options.find((o) => o.isCorrect)?.text ?? ""),
          difficulty: updatedTest.difficulty || "easy",
          updatedAt: serverTimestamp(),
        }
      : {
          question: updatedTest.question,
          optionA: updatedTest.optionA,
          optionB: updatedTest.optionB,
          optionC: updatedTest.optionC,
          correctAnswer: updatedTest.correctAnswer,
          difficulty: updatedTest.difficulty || "easy",
          updatedAt: serverTimestamp(),
        };

    await updateDoc(ref, payload);
  };

  // Delete test
  const deleteTest = async (testId) => {
    const ref = doc(db, "questions", testId);
    await deleteDoc(ref);
  };

  const getRandomizedTests = (difficulty) => {
    const difficultyTests = tests[difficulty] || [];
    if (difficultyTests.length === 0) return [];

    const shuffledQuestions = [...difficultyTests].sort(
      () => Math.random() - 0.5
    );

    return shuffledQuestions.map((question) => {
      if (Array.isArray(question.options) && question.options.length >= 2) {
        const shuffledOptions = [...question.options].sort(
          () => Math.random() - 0.5
        );
        const correctOption = question.options.find((o) => o.isCorrect);
        return {
          ...question,
          options: shuffledOptions,
          correctAnswer: correctOption
            ? correctOption.text
            : question.correctAnswer,
        };
      }

      const legacyAnswers = [
        question.optionA ?? question.correctAnswer,
        question.optionB,
        question.optionC,
      ].filter(Boolean);
      const shuffledLegacy = [...legacyAnswers].sort(() => Math.random() - 0.5);
      const normalizedOptions = shuffledLegacy.map((text) => ({
        id: Math.random().toString(36).slice(2),
        text,
        isCorrect: text === question.correctAnswer,
      }));

      return {
        ...question,
        options: normalizedOptions,
        correctAnswer: question.correctAnswer,
      };
    });
  };

  const startTest = (difficulty) => {
    const randomizedTests = getRandomizedTests(difficulty);
    if (randomizedTests.length === 0) return false;

    setCurrentTest({
      difficulty,
      questions: randomizedTests,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
    });
    return true;
  };

  const submitAnswer = (answer) => {
    if (!currentTest) return;
    setCurrentTest((prev) => ({
      ...prev,
      answers: [...prev.answers, answer],
    }));
  };

  const finishTest = () => {
    if (!currentTest) return;

    const correctAnswers = currentTest.answers.filter((answer, index) => {
      const question = currentTest.questions[index];
      return answer === question.correctAnswer;
    }).length;

    const totalQuestions = currentTest.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    setTestResults({
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      percentage,
      timeSpent: Date.now() - currentTest.startTime,
    });

    setCurrentTest(null);
  };

  const resetTest = () => {
    setCurrentTest(null);
    setTestResults(null);
  };

  const value = {
    tests,
    addTest,
    editTest,
    deleteTest,
    currentTest,
    testResults,
    startTest,
    submitAnswer,
    finishTest,
    resetTest,
    getRandomizedTests,
    setCurrentTest,
    isLoadingTests,
    firestoreError,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};
