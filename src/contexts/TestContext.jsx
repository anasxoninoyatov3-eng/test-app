import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
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
  const [studentResults, setStudentResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  // Real-time Firestore listener — questions
  useEffect(() => {
    setIsLoadingTests(true);
    const testsRef = collection(db, "questions");

    const unsubscribe = onSnapshot(
      testsRef,
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
        console.error("Firestore questions onSnapshot xatolik:", error.code, error.message);
        setFirestoreError(error.code);
        setIsLoadingTests(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener — student test_results
  useEffect(() => {
    const resultsRef = collection(db, "test_results");
    const q = query(resultsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStudentResults(list);
      },
      (error) => {
        // Fallback without orderBy if index is missing
        onSnapshot(resultsRef, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setStudentResults(list);
        });
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

  // Delete test directly using Firebase native deleteDoc
  const deleteTest = async (testId) => {
    if (!testId) {
      console.error("deleteTest: testId parameter is missing");
      return;
    }
    try {
      const testRef = doc(db, "questions", testId);
      await deleteDoc(testRef);
    } catch (err) {
      console.error("Firebase deleteDoc error:", err);
    }

    // Optimistic state updates for both allTests and tests
    setAllTests((prev) => prev.filter((t) => t.id !== testId));
    setTests((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = updated[key].filter((t) => t.id !== testId);
      });
      return updated;
    });
  };

  // Delete entire topic (all questions in topic) natively using Firebase writeBatch
  const deleteTopic = async (topicName) => {
    const topicQuestions = allTests.filter(
      (t) => (t.testName || "Umumiy Test") === topicName
    );
    if (topicQuestions.length === 0) return;

    try {
      const batch = writeBatch(db);
      topicQuestions.forEach((q) => {
        if (q.id) {
          const qRef = doc(db, "questions", q.id);
          batch.delete(qRef);
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Firebase batch delete error:", err);
    }

    // Optimistic state updates for both allTests and tests
    setAllTests((prev) => prev.filter((t) => (t.testName || "Umumiy Test") !== topicName));
    setTests((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = updated[key].filter(
          (t) => (t.testName || "Umumiy Test") !== topicName
        );
      });
      return updated;
    });
  };

  // Delete student test result natively using Firebase deleteDoc
  const deleteStudentResult = async (resultId) => {
    if (!resultId) return;
    try {
      const resultRef = doc(db, "test_results", resultId);
      await deleteDoc(resultRef);
    } catch (err) {
      console.error("Firebase result deleteDoc error:", err);
    }
    setStudentResults((prev) => prev.filter((r) => r.id !== resultId));
  };

  // Toggle Topic Active/Inactive status using Firebase writeBatch
  const toggleTopicStatus = async (topicName, newStatus) => {
    const topicQuestions = allTests.filter(
      (t) => (t.testName || "Umumiy Test") === topicName
    );
    if (topicQuestions.length === 0) return;

    // Optimistic UI updates first
    setAllTests((prev) =>
      prev.map((t) =>
        (t.testName || "Umumiy Test") === topicName ? { ...t, isActive: newStatus } : t
      )
    );
    setTests((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = updated[key].map((t) =>
          (t.testName || "Umumiy Test") === topicName ? { ...t, isActive: newStatus } : t
        );
      });
      return updated;
    });

    try {
      const batch = writeBatch(db);
      topicQuestions.forEach((q) => {
        if (q.id) {
          const qRef = doc(db, "questions", q.id);
          batch.update(qRef, { isActive: newStatus });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Firebase batch update error:", err);
    }
  };

  // Merge all existing tests into 1 single topic using Firebase writeBatch
  const mergeAllTestsToOneTopic = async (targetTopicName = "Matematika 1-Boshqich") => {
    if (allTests.length === 0) return;

    const batch = writeBatch(db);
    allTests.forEach((q) => {
      if (q.id) {
        const qRef = doc(db, "questions", q.id);
        batch.update(qRef, { testName: targetTopicName });
      }
    });

    await batch.commit();
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

  const finishTest = async () => {
    if (!currentTest) return;

    let savedUser = null;
    try {
      const u = localStorage.getItem("app_current_user");
      if (u) savedUser = JSON.parse(u);
    } catch (e) {}

    const studentName =
      savedUser?.username ||
      savedUser?.firstName ||
      savedUser?.email ||
      "Mehmon O'quvchi";

    const auditDetails = currentTest.questions.map((question, index) => {
      const userAnswer = currentTest.answers[index] || "Javob berilmadi";
      const isCorrect = userAnswer === question.correctAnswer;
      return {
        questionNumber: index + 1,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
    });

    const correctAnswers = auditDetails.filter((a) => a.isCorrect).length;
    const totalQuestions = currentTest.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Date.now() - currentTest.startTime;

    const topicName =
      currentTest.questions[0]?.testName ||
      `Matematika (${currentTest.difficulty || "Oson"})`;

    const resultPayload = {
      studentName,
      studentEmail: savedUser?.email || "",
      studentAvatar: savedUser?.avatar || "",
      topicName,
      difficulty: currentTest.difficulty || "easy",
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      percentage,
      timeSpent,
      createdAt: serverTimestamp(),
      createdDateStr:
        new Date().toLocaleDateString("uz-UZ") +
        " " +
        new Date().toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      auditDetails,
    };

    setTestResults(resultPayload);

    // Save to Firestore 'test_results' collection
    try {
      const resultsRef = collection(db, "test_results");
      await addDoc(resultsRef, resultPayload);
    } catch (err) {
      console.error("Firestore test_results addDoc xatolik:", err);
    }

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
    studentResults,
    addTest,
    editTest,
    deleteTest,
    deleteTopic,
    deleteStudentResult,
    mergeAllTestsToOneTopic,
    toggleTestStatus,
    toggleTopicStatus,
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
