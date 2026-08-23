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
  const [allTests, setAllTests] = useState([]);
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
        const flatList = [];
        snapshot.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          const diff = ["easy", "medium", "hard"].includes(data.difficulty)
            ? data.difficulty
            : "easy";

          // Ensure default isActive flag is set to true if not specified
          if (data.isActive === undefined) {
            data.isActive = true;
          }

          grouped[diff].push(data);
          flatList.push(data);
        });
        setTests(grouped);
        setAllTests(flatList);
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

  // Add test — directly saves to Firestore with default isActive: true
  const addTest = async (test) => {
    const testsRef = collection(db, "questions");
    const hasOptionsArray =
      Array.isArray(test.options) && test.options.length >= 2;

    const payload = hasOptionsArray
      ? {
          testName: test.testName || "Umumiy Test",
          imageUrl: test.imageUrl || "",
          question: test.question,
          options: test.options.map((o) => ({
            id: o.id || Math.random().toString(36).slice(2),
            text: o.text,
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer:
            test.correctAnswer ||
            (test.options.find((o) => o.isCorrect)?.text ?? ""),
          difficulty: "easy",
          isActive: true,
          createdAt: serverTimestamp(),
        }
      : {
          testName: test.testName || "Umumiy Test",
          imageUrl: test.imageUrl || "",
          question: test.question,
          optionA: test.optionA,
          optionB: test.optionB,
          optionC: test.optionC,
          correctAnswer: test.correctAnswer,
          difficulty: "easy",
          isActive: true,
          createdAt: serverTimestamp(),
        };

    await addDoc(testsRef, payload);
  };

  // Toggle Test Active/Inactive status
  const toggleTestStatus = async (testId, currentStatus) => {
    const ref = doc(db, "questions", testId);
    await updateDoc(ref, { isActive: !currentStatus });
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
          isActive: updatedTest.isActive !== undefined ? updatedTest.isActive : true,
          updatedAt: serverTimestamp(),
        }
      : {
          question: updatedTest.question,
          optionA: updatedTest.optionA,
          optionB: updatedTest.optionB,
          optionC: updatedTest.optionC,
          correctAnswer: updatedTest.correctAnswer,
          difficulty: updatedTest.difficulty || "easy",
          isActive: updatedTest.isActive !== undefined ? updatedTest.isActive : true,
          updatedAt: serverTimestamp(),
        };

    await updateDoc(ref, payload);
  };

  // Delete test
  const deleteTest = async (testId) => {
    const ref = doc(db, "questions", testId);
    await deleteDoc(ref);
  };

  // Only get ACTIVE tests for users to solve
  const getRandomizedTests = (difficulty) => {
    const difficultyTests = (tests[difficulty] || []).filter(
      (t) => t.isActive !== false
    );
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

  // Get active test categories / collections created by Admin
  const getTestCategories = () => {
    const allActive = [];
    Object.values(tests).forEach((list) => {
      list.forEach((t) => {
        if (t.isActive !== false) {
          allActive.push(t);
        }
      });
    });

    const categories = {};
    allActive.forEach((t) => {
      const catName = t.testName || "Umumiy Test";
      if (!categories[catName]) {
        categories[catName] = {
          name: catName,
          questions: [],
          imageUrl: t.imageUrl || "",
        };
      }
      categories[catName].questions.push(t);
    });

    return Object.values(categories);
  };

  const startTestByCategory = (categoryName) => {
    let matchedQuestions = [];
    Object.values(tests).forEach((list) => {
      list.forEach((t) => {
        if (t.isActive !== false) {
          const catName = t.testName || "Umumiy Test";
          if (catName === categoryName || categoryName === "all") {
            matchedQuestions.push(t);
          }
        }
      });
    });

    if (matchedQuestions.length === 0) return false;

    const shuffledQuestions = [...matchedQuestions].sort(() => Math.random() - 0.5);
    const preparedQuestions = shuffledQuestions.map((q) => {
      if (Array.isArray(q.options) && q.options.length >= 2) {
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        const correctOption = q.options.find((o) => o.isCorrect);
        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: correctOption ? correctOption.text : q.correctAnswer,
        };
      }
      return q;
    });

    setCurrentTest({
      categoryName,
      difficulty: "easy",
      questions: preparedQuestions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
    });
    return true;
  };

  const value = {
    tests,
    allTests,
    addTest,
    editTest,
    deleteTest,
    toggleTestStatus,
    currentTest,
    testResults,
    startTest,
    submitAnswer,
    finishTest,
    resetTest,
    getRandomizedTests,
    getTestCategories,
    startTestByCategory,
    setCurrentTest,
    isLoadingTests,
    firestoreError,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};
