import { useState, useEffect, useRef } from "react";
import { FiCamera, FiUploadCloud, FiImage } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTest } from "../contexts/TestContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiLogOut,
  FiMoon,
  FiSun,
  FiChevronRight,
  FiChevronLeft,
  FiSearch,
  FiBookOpen,
  FiStar,
  FiZap,
  FiTarget,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiUsers,
  FiBarChart,
  FiAward,
  FiUserCheck,
  FiClock,
  FiUser,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const {
    addTest,
    editTest,
    deleteTest,
    deleteTopic,
    deleteStudentResult,
    mergeAllTestsToOneTopic,
    toggleTestStatus,
    toggleTopicStatus,
    tests,
    allTests,
    studentResults,
    isLoadingTests,
  } = useTest();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [selectedAuditResult, setSelectedAuditResult] = useState(null);

  const [formData, setFormData] = useState({
    testName: "Matematika 1-Boshqich",
    imageUrl: "",
    question: "",
    options: [
      { id: Math.random().toString(36).slice(2), text: "", isCorrect: false },
      { id: Math.random().toString(36).slice(2), text: "", isCorrect: false },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      alert("Kameraga ulanishda xatolik yoki ruxsat berilmadi: " + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Iltimos, faqat rasm faylini tanlang!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, imageUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };
  const [message, setMessage] = useState("");
  const [editingTest, setEditingTest] = useState(null);
  const [showTests, setShowTests] = useState(true);

  const [activeTab, setActiveTab] = useState("create");

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Chiqishda xatolik:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionTextChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.id === id ? { ...o, text: value } : o
      ),
    }));
  };

  const addOptionRow = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: Math.random().toString(36).slice(2), text: "", isCorrect: false },
      ],
    }));
  };

  const removeOptionRow = (id) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== id),
    }));
  };

  const setCorrectOption = (id) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((o) => ({ ...o, isCorrect: o.id === id })),
    }));
  };

  const deriveOptionsFromLegacy = (test) => {
    const legacy = [test.optionA, test.optionB, test.optionC].filter(Boolean);
    return legacy.map((t) => ({
      id: Math.random().toString(36).slice(2),
      text: t,
      isCorrect: t === test.correctAnswer,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedOptions = (formData.options || []).map((o) => ({
      ...o,
      text: (o.text || "").trim(),
    }));
    const nonEmpty = cleanedOptions.filter((o) => o.text.length > 0);
    const hasAtLeastTwo = nonEmpty.length >= 2;
    const correct = nonEmpty.find((o) => o.isCorrect);
    if (!formData.question.trim() || !hasAtLeastTwo || !correct) {
      setMessage(
        !formData.question.trim()
          ? "Savol matnini kiriting!"
          : !hasAtLeastTwo
          ? "Kamida 2 ta javob variantini kiriting!"
          : "Bitta to'g'ri javobni belgilang!"
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const normalizedOptions = nonEmpty.map((o) => ({
        id: o.id || Math.random().toString(36).slice(2),
        text: o.text,
        isCorrect: !!o.isCorrect,
      }));

      const newTest = {
        testName: formData.testName.trim() || "Umumiy Test",
        imageUrl: formData.imageUrl.trim() || "",
        question: formData.question.trim(),
        options: normalizedOptions,
        correctAnswer: correct.text,
        difficulty: formData.difficulty,
      };

      await addTest(newTest);

      setMessage("Test muvaffaqiyatli qo'shildi!");

      // Reset form - keep testName so admin can add more questions to same topic
      setFormData({
        testName: formData.testName || "Matematika 1-Boshqich",
        imageUrl: "",
        question: "",
        options: [
          {
            id: Math.random().toString(36).slice(2),
            text: "",
            isCorrect: false,
          },
          {
            id: Math.random().toString(36).slice(2),
            text: "",
            isCorrect: false,
          },
        ],
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    const options =
      Array.isArray(test.options) && test.options.length
        ? test.options.map((o) => ({
            id: o.id || Math.random().toString(36).slice(2),
            text: o.text,
            isCorrect: !!o.isCorrect,
          }))
        : deriveOptionsFromLegacy(test);
    setFormData({
      testName: test.testName || "Umumiy Test",
      imageUrl: test.imageUrl || "",
      question: test.question,
      options,
      difficulty: test.difficulty || "easy",
    });
    setShowTests(false);
    setActiveTab("create");
  };

  const handleDeleteTest = async (testId) => {
    if (!testId) {
      alert("Xatolik: Test ID topilmadi!");
      return;
    }
    if (window.confirm("Bu savolni Firebase ma'lumotlar bazasidan o'chirishni xohlaysizmi?")) {
      try {
        await deleteTest(testId);
        setMessage("Savol Firebase'dan muvaffaqiyatli o'chirildi!");
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        console.error("Test o'chirishda xatolik:", err);
        alert("O'chirishda xatolik yuz berdi: " + (err.message || err));
      }
    }
  };

  const handleDeleteStudentResult = async (resultId) => {
    if (!resultId) return;
    if (window.confirm("Ushbu o'quvchining test natijasini Firebase'dan o'chirishni xohlaysizmi?")) {
      try {
        await deleteStudentResult(resultId);
        setMessage("O'quvchi natijasi o'chirildi!");
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        console.error("Result delete error:", err);
        alert("Natijani o'chirishda xatolik yuz berdi.");
      }
    }
  };

  const handleDeleteTopic = async (topicName) => {
    if (
      window.confirm(
        `"${topicName}" mavzusini va unga tegishli barcha testlarni Firebase'dan batamom o'chirishni xohlaysizmi?`
      )
    ) {
      try {
        await deleteTopic(topicName);
        setMessage(`"${topicName}" mavzusi va uning barcha testlari Firebase'dan o'chirildi!`);
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        console.error(err);
        setMessage("Mavzuni o'chirishda xatolik yuz berdi.");
      }
    }
  };

  const handleToggleTopicStatus = async (topicName, newStatus) => {
    try {
      await toggleTopicStatus(topicName, newStatus);
      setMessage(
        newStatus
          ? `"${topicName}" mavzusi barcha o'quvchilarga ko'rsatildi!`
          : `"${topicName}" mavzusi o'quvchilardan yashirildi!`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Mavzu holatini o'zgartirishda xatolik yuz berdi.");
    }
  };

  const handleMergeAllToOneTopic = async (targetTopicName = "Matematika 1-Boshqich") => {
    if (
      window.confirm(
        `Hozirgi mavjud barcha testlarni "${targetTopicName}" mavzusiga o'tkazishni xohlaysizmi?`
      )
    ) {
      try {
        await mergeAllTestsToOneTopic(targetTopicName);
        setMessage(`Barcha testlar "${targetTopicName}" mavzusiga muvaffaqiyatli birlashtirildi!`);
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        console.error(err);
        setMessage("Testlarni birlashtirishda xatolik yuz berdi.");
      }
    }
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();

    const cleanedOptions = (formData.options || []).map((o) => ({
      ...o,
      text: (o.text || "").trim(),
    }));
    const nonEmpty = cleanedOptions.filter((o) => o.text.length > 0);
    const hasAtLeastTwo = nonEmpty.length >= 2;
    const correct = nonEmpty.find((o) => o.isCorrect);
    if (!formData.question.trim() || !hasAtLeastTwo || !correct) {
      setMessage(
        !formData.question.trim()
          ? "Savol matnini kiriting!"
          : !hasAtLeastTwo
          ? "Kamida 2 ta javob variantini kiriting!"
          : "Bitta to'g'ri javobni belgilang!"
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const normalizedOptions = nonEmpty.map((o) => ({
        id: o.id || Math.random().toString(36).slice(2),
        text: o.text,
        isCorrect: !!o.isCorrect,
      }));

      const updatedTest = {
        ...editingTest,
        testName: formData.testName.trim() || "Umumiy Test",
        imageUrl: formData.imageUrl.trim() || "",
        question: formData.question.trim(),
        options: normalizedOptions,
        correctAnswer: correct.text,
        difficulty: formData.difficulty,
      };

      await editTest(editingTest.id, updatedTest);
      setMessage("Test muvaffaqiyatli yangilandi!");

      // Reset form and editing state
      setFormData({
        testName: formData.testName || "Matematika 1-Boshqich",
        imageUrl: "",
        question: "",
        options: [
          {
            id: Math.random().toString(36).slice(2),
            text: "",
            isCorrect: false,
          },
          {
            id: Math.random().toString(36).slice(2),
            text: "",
            isCorrect: false,
          },
        ],
      });
      setEditingTest(null);

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setFormData({
      question: "",
      options: [
        { id: Math.random().toString(36).slice(2), text: "", isCorrect: false },
        { id: Math.random().toString(36).slice(2), text: "", isCorrect: false },
      ],
    });
  };

  const toggleShowTests = () => {
    setShowTests(!showTests);
    if (editingTest) {
      handleCancelEdit();
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    try {
      if (typeof ts?.toDate === "function") {
        return ts.toDate().toLocaleDateString("uz-UZ");
      }
      const d = new Date(ts);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("uz-UZ");
    } catch (e) {
      return "";
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return <FiStar className="difficulty-icon easy" />;
      case "medium":
        return <FiTarget className="difficulty-icon medium" />;
      case "hard":
        return <FiZap className="difficulty-icon hard" />;
      default:
        return <FiStar className="difficulty-icon" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "hard":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="admin-container" data-theme={theme}>
      {/* Floating Background Elements */}
      <div className="floating-elements">
        <motion.div
          className="floating-element element-1"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FiBookOpen />
        </motion.div>
        <motion.div
          className="floating-element element-2"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -3, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FiTarget />
        </motion.div>
        <motion.div
          className="floating-element element-3"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FiZap />
        </motion.div>
      </div>

      {/* Header */}
      <motion.header
        className="admin-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.button
          className="back-btn"
          onClick={handleBackToHome}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiChevronLeft className="back-icon" />
          <span className="back-text">Orqaga</span>
        </motion.button>

        <div className="header-center">
          <h1 className="admin-title">
            <FiSettings className="title-icon" />
            Admin Panel
          </h1>
          <p className="header-subtitle">Test tizimini boshqarish</p>
        </div>

        <div className="header-actions">
          <motion.button
            className="logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogOut className="logout-icon" />
            <span className="logout-text">Chiqish</span>
          </motion.button>

          <motion.button
            className="theme-toggle-admin"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="admin-main">
        {/* Tab Navigation */}
        <motion.div
          className="tab-navigation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.button
            className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus className="tab-icon" />
            Test Yaratish
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "manage" ? "active" : ""}`}
            onClick={() => setActiveTab("manage")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiBookOpen className="tab-icon" />
            Testlarni Boshqarish
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiAward className="tab-icon" />
            O'quvchilar Natijalari
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiBarChart className="tab-icon" />
            Statistika
          </motion.button>
        </motion.div>

        {/* Create Test Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="admin-card create-test-card"
            >
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FiBookOpen />
                </motion.div>
                <h2>Yangi Test Yaratish</h2>
                <p>O'quvchilar uchun yangi test savolini tuzing</p>
              </div>

              <form
                onSubmit={editingTest ? handleUpdateTest : handleSubmit}
                className="admin-form"
              >
                {/* Test Nomi (Category / Subject) */}
                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <label htmlFor="testName">
                    <FiBookOpen className="label-icon" />
                    Mavzu / Fan Nomi
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="testName"
                      name="testName"
                      value={formData.testName}
                      onChange={handleInputChange}
                      placeholder="Masalan: Matematika 1-Boshqich, Tarix, Fizika..."
                      required
                      className="option-input"
                      style={{ width: "100%", padding: "1.2rem 1.5rem", borderRadius: "16px", fontSize: "1.05rem" }}
                    />
                  </div>
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#10b981", fontWeight: "600" }}>
                    <FiTarget style={{ fontSize: "0.9rem" }} />
                    <span>Bir mavzuга bir nechta savol qo'shish uchun mavzu nomini o'zgartirmang!</span>
                  </div>
                </motion.div>

                {/* Savol Rasmi (File Upload / Camera Capture / URL) */}
                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <label>
                    <FiImage className="label-icon" />
                    Savol Rasmi (Fayldan yuklash yoki Kameradan rasmga olish)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />

                  <div className="image-source-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "white",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      <FiUploadCloud size={18} /> Fayllardan Yuklash 📁
                    </button>

                    <button
                      type="button"
                      onClick={isCameraActive ? stopCamera : startCamera}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px",
                        borderRadius: "14px",
                        background: isCameraActive ? "#ef4444" : "linear-gradient(135deg, #10b981, #059669)",
                        color: "white",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <FiCamera size={18} /> {isCameraActive ? "Kamerani Yopish ❌" : "Kameradan Olish 📷"}
                    </button>
                  </div>

                  {/* Active Camera View */}
                  {isCameraActive && (
                    <div style={{ textAlign: "center", background: "#000", padding: "15px", borderRadius: "16px", marginBottom: "15px" }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%", maxHeight: "320px", borderRadius: "12px", objectFit: "contain" }}
                      />
                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          style={{
                            padding: "10px 24px",
                            borderRadius: "30px",
                            background: "#fbbf24",
                            color: "#000",
                            border: "none",
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: "1rem",
                          }}
                        >
                          📸 Rasmga Olish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Preview or Manual URL fallback */}
                  {formData.imageUrl ? (
                    <div style={{ position: "relative", textAlign: "center", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                      <img
                        src={formData.imageUrl}
                        alt="Test rasmi"
                        style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "10px", objectFit: "contain" }}
                      />
                      <div style={{ marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            border: "1px solid #ef4444",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          🗑️ Rasmni O'chirish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Yoki Rasm URL havolasini shu yerga kiriting..."
                      className="option-input"
                      style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "14px", fontSize: "0.95rem" }}
                    />
                  )}
                </motion.div>

                {/* Question Input */}
                <motion.div
                  className="form-group question-group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <label htmlFor="question">
                    <FiBookOpen className="label-icon" />
                    Test Savoli
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="question"
                      name="question"
                      value={formData.question}
                      onChange={handleInputChange}
                      placeholder="Test savolini kiriting..."
                      rows="4"
                      required
                      className="question-textarea"
                    />
                    <div className="input-focus-border"></div>
                  </div>
                </motion.div>

                {/* Options Builder */}
                <motion.div
                  className="options-builder"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="options-header">
                    <h3>
                      <FiTarget className="section-icon" />
                      Javob Variantlari
                    </h3>
                    <p>
                      Kamida 2 ta variant kiriting va to'g'ri javobni belgilang
                    </p>
                  </div>

                  <div className="options-list">
                    {formData.options.map((opt, idx) => (
                      <motion.div
                        className="option-row"
                        key={opt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * idx }}
                        layout
                      >
                        <motion.button
                          type="button"
                          className={`correct-toggle ${
                            opt.isCorrect ? "active" : ""
                          }`}
                          onClick={() => setCorrectOption(opt.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="To'g'ri javobni belgilash"
                        >
                          {opt.isCorrect ? <FiCheckCircle /> : <FiStar />}
                        </motion.button>

                        <div className="option-input-wrapper">
                          <input
                            type="text"
                            className="option-input"
                            placeholder={`Variant ${idx + 1}`}
                            value={opt.text}
                            onChange={(e) =>
                              handleOptionTextChange(opt.id, e.target.value)
                            }
                          />
                          <div className="input-focus-border"></div>
                        </div>

                        {formData.options.length > 2 && (
                          <motion.button
                            type="button"
                            className="remove-option"
                            onClick={() => removeOptionRow(opt.id)}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Variantni o'chirish"
                          >
                            <FiXCircle />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    className="add-option"
                    onClick={addOptionRow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus className="add-icon" />
                    Yangi Variant Qo'shish
                  </motion.button>

                  <div className="options-hint">
                    <FiStar className="hint-icon" />
                    <span>Bitta yulduzni bosib to'g'ri javobni belgilang</span>
                  </div>
                </motion.div>



                {/* Message Display */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      className={`message ${
                        message.includes("muvaffaqiyatli") ? "success" : "error"
                      }`}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      {message.includes("muvaffaqiyatli") ? (
                        <FiCheckCircle className="message-icon" />
                      ) : (
                        <FiXCircle className="message-icon" />
                      )}
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Actions */}
                <motion.div
                  className="form-actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {editingTest && (
                    <motion.button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiXCircle className="btn-icon" />
                      Bekor Qilish
                    </motion.button>
                  )}

                  <motion.button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="btn-content">
                      {isSubmitting ? (
                        <>
                          <motion.div
                            className="loading-spinner"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          Yuborilmoqda...
                        </>
                      ) : (
                        <>
                          {editingTest ? (
                            <>
                              <FiEdit2 className="btn-icon" />
                              Yangilash
                            </>
                          ) : (
                            <>
                              <FiPlus className="btn-icon" />
                              Test Yaratish
                            </>
                          )}
                        </>
                      )}
                    </span>
                    <div className="btn-ripple"></div>
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          )}

          {/* Manage Tests Tab */}
          {activeTab === "manage" && (() => {
            // Group all tests by topic name
            const allTestsList = allTests && allTests.length > 0 ? allTests : Object.values(tests).flat();
            const topicMap = {};
            allTestsList.forEach((t) => {
              const name = t.testName || "Umumiy Test";
              if (!topicMap[name]) topicMap[name] = [];
              topicMap[name].push(t);
            });
            const topicEntries = Object.entries(topicMap);

            return (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="admin-card manage-tests-card"
              >
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <motion.div
                      className="header-icon"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FiBookOpen />
                    </motion.div>
                    <h2>Mavzularni Boshqarish</h2>
                    <p>Mavjud mavzularni ko'rish, testlarini tahrirlash va o'chirish</p>
                  </div>

                  {allTestsList.length > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => handleMergeAllToOneTopic("Matematika 1-Boshqich")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                        color: "white",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      🎯 Barcha testlarni 1 ta mavzuga o'tkazish
                    </motion.button>
                  )}
                </div>

                {isLoadingTests ? (
                  <div className="loading-state">
                    <motion.div
                      className="loading-spinner large"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p>Yuklanmoqda...</p>
                  </div>
                ) : topicEntries.length === 0 ? (
                  <div className="no-tests" style={{ textAlign: "center", padding: "3rem" }}>
                    <FiBookOpen className="no-tests-icon" style={{ fontSize: "3rem", opacity: 0.4 }} />
                    <p style={{ marginTop: "1rem", opacity: 0.6 }}>Hali hech qanday mavzu qo'shilmagan</p>
                  </div>
                ) : (
                  <div className="topics-accordion">
                    {topicEntries.map(([topicName, topicTests], topicIdx) => (
                      <TopicAccordionItem
                        key={topicName}
                        topicName={topicName}
                        topicTests={topicTests}
                        topicIdx={topicIdx}
                        toggleTestStatus={toggleTestStatus}
                        handleToggleTopicStatus={handleToggleTopicStatus}
                        handleEditTest={handleEditTest}
                        handleDeleteTest={handleDeleteTest}
                        handleDeleteTopic={handleDeleteTopic}
                        getDifficultyIcon={getDifficultyIcon}
                        getDifficultyColor={getDifficultyColor}
                        formatDate={formatDate}
                        setActiveTab={setActiveTab}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Student Results & Audit Tab */}
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="admin-card student-results-card"
            >
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FiAward />
                </motion.div>
                <h2>O'quvchilar Natijalari va Audit Tahlili</h2>
                <p>Test topshirgan o'quvchilar ro'yxati, bali, to'g'ri/noto'g'ri javoblari va har bir savol auditi</p>
              </div>

              {studentResults.length === 0 ? (
                <div className="no-tests" style={{ textAlign: "center", padding: "3rem" }}>
                  <FiUserCheck style={{ fontSize: "3.5rem", opacity: 0.3, color: "#8b5cf6" }} />
                  <p style={{ marginTop: "1rem", fontSize: "1.1rem", opacity: 0.7 }}>Hali hech bir o'quvchi test topshirmagan</p>
                  <span style={{ fontSize: "0.85rem", opacity: 0.5 }}>O'quvchilar test ishlaganda uning barcha natijalari va audit tahlili shu yerda avtomatik ko'rinadi.</span>
                </div>
              ) : (
                <div className="student-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.2rem", marginTop: "1.5rem" }}>
                  {studentResults.map((result, idx) => {
                    const pct = result.percentage || 0;
                    const pctColor = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                    const formatDuration = (ms) => {
                      if (!ms) return "0:00";
                      const sec = Math.floor(ms / 1000);
                      const m = Math.floor(sec / 60);
                      const s = sec % 60;
                      return `${m}:${s.toString().padStart(2, "0")}`;
                    };

                    return (
                      <motion.div
                        key={result.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "18px",
                          padding: "1.3rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                        }}
                      >
                        <div>
                          {/* Student info header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {result.studentAvatar ? (
                                <img src={result.studentAvatar} alt="avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#6366f1" }} />
                              ) : (
                                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
                                  <FiUser style={{ fontSize: "1.2rem" }} />
                                </div>
                              )}
                              <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>{result.studentName || "Noma'lum O'quvchi"}</h3>
                                {result.studentEmail && (
                                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{result.studentEmail}</span>
                                )}
                              </div>
                            </div>

                            {/* Percentage badge */}
                            <div style={{ padding: "6px 14px", borderRadius: "20px", background: `${pctColor}22`, border: `1px solid ${pctColor}55`, color: pctColor, fontWeight: "800", fontSize: "1.1rem" }}>
                              {pct}%
                            </div>
                          </div>

                          {/* Details */}
                          <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ opacity: 0.7 }}>Mavzu:</span>
                              <strong style={{ color: "#a855f7" }}>{result.topicName || "Umumiy Test"}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ opacity: 0.7 }}>Natija:</span>
                              <span>
                                <strong style={{ color: "#10b981" }}>{result.correctAnswers || 0} to'g'ri</strong> / <strong style={{ color: "#ef4444" }}>{result.incorrectAnswers || 0} noto'g'ri</strong> ({result.totalQuestions || 0} ta)
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ opacity: 0.7 }}>Sarflangan vaqt:</span>
                              <span>⏱️ {formatDuration(result.timeSpent)}</span>
                            </div>
                            {result.createdDateStr && (
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ opacity: 0.7 }}>Sana:</span>
                                <span style={{ opacity: 0.8, fontSize: "0.82rem" }}>📅 {result.createdDateStr}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                          <motion.button
                            type="button"
                            onClick={() => setSelectedAuditResult(result)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                              color: "white",
                              border: "none",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FiSearch /> Kichik Audit 🔍
                          </motion.button>

                          <motion.button
                            type="button"
                            onClick={() => handleDeleteStudentResult(result.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "12px",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="O'quvchi natijasini bazadan o'chirish"
                          >
                            <FiTrash2 /> O'chirish
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="admin-card stats-card"
            >
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FiBarChart />
                </motion.div>
                <h2>Test Tizimi Statistikalari</h2>
                <p>Test tizimi haqida umumiy ma'lumotlar</p>
              </div>

              {(() => {
                const allTestsList = Object.values(tests).flat();
                const topicSet = new Set(allTestsList.map(t => t.testName || "Umumiy Test"));
                const activeCount = allTestsList.filter(t => t.isActive !== false).length;
                const inactiveCount = allTestsList.filter(t => t.isActive === false).length;
                return (
                  <div className="stats-grid">
                    <motion.div
                      className="stat-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="stat-icon">
                        <FiBookOpen />
                      </div>
                      <div className="stat-content">
                        <h3>Jami Savollar</h3>
                        <p className="stat-number">{allTestsList.length}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="stat-icon">
                        <FiStar />
                      </div>
                      <div className="stat-content">
                        <h3>Jami Mavzular</h3>
                        <p className="stat-number">{topicSet.size}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="stat-icon">
                        <FiCheckCircle />
                      </div>
                      <div className="stat-content">
                        <h3>Faol Savollar</h3>
                        <p className="stat-number">{activeCount}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="stat-icon">
                        <FiXCircle />
                      </div>
                      <div className="stat-content">
                        <h3>Yashirilgan Savollar</h3>
                        <p className="stat-number">{inactiveCount}</p>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Audit Details Modal */}
      <AnimatePresence>
        {selectedAuditResult && (
          <AuditModal
            result={selectedAuditResult}
            onClose={() => setSelectedAuditResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;

// TopicAccordionItem component for Manage Tests tab
const TopicAccordionItem = ({
  topicName,
  topicTests,
  topicIdx,
  toggleTestStatus,
  handleToggleTopicStatus,
  handleEditTest,
  handleDeleteTest,
  handleDeleteTopic,
  getDifficultyIcon,
  getDifficultyColor,
  formatDate,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(topicIdx === 0);

  const isTopicActive = topicTests.some((t) => t.isActive !== false);
  const activeCount = topicTests.filter((t) => t.isActive !== false).length;
  const totalCount = topicTests.length;

  return (
    <motion.div
      className="topic-accordion-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: topicIdx * 0.08 }}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: isTopicActive ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "20px",
        marginBottom: "1.5rem",
        overflow: "hidden",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        opacity: isTopicActive ? 1 : 0.75,
      }}
    >
      {/* Header */}
      <div
        className="topic-accordion-header"
        style={{
          padding: "1.2rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isTopicActive ? "rgba(255, 255, 255, 0.05)" : "rgba(239, 68, 68, 0.05)",
          cursor: "pointer",
          userSelect: "none",
          gap: "1rem",
          flexWrap: "wrap",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "220px" }}>
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", alignItems: "center", color: "#6366f1", fontSize: "1.3rem" }}
          >
            <FiChevronRight />
          </motion.div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiBookOpen style={{ color: "#a855f7" }} />
              {topicName}
            </h3>
            <span style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "4px", display: "inline-block" }}>
              Jami savollar: {totalCount} ta | Faol: {activeCount} ta
            </span>
          </div>
        </div>

        {/* Topic Level Actions */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Status Badge */}
          <span
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "700",
              background: isTopicActive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: isTopicActive ? "#10b981" : "#ef4444",
              border: isTopicActive ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
            }}
          >
            {isTopicActive ? "🟢 Faol Mavzu" : "🔴 Yashirilgan"}
          </span>

          {/* Toggle Topic Visibility Button */}
          <motion.button
            type="button"
            onClick={() => handleToggleTopicStatus(topicName, !isTopicActive)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "12px",
              background: isTopicActive ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: isTopicActive ? "#f59e0b" : "#10b981",
              border: isTopicActive ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
            title={isTopicActive ? "Ushbu mavzuni barcha o'quvchilardan yashirish" : "Ushbu mavzuni o'quvchilarga ko'rsatish"}
          >
            {isTopicActive ? <FiEyeOff /> : <FiEye />}
            {isTopicActive ? "Mavzuni Yashirish" : "Mavzuni Ko'rsatish"}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => handleDeleteTopic(topicName)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
            title="Ushbu mavzu va uning barcha testlarini Firebase'dan o'chirish"
          >
            <FiTrash2 /> Mavzuni O'chirish 🔥
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "12px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#6366f1",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            <FiEye /> {isOpen ? "Yopish" : "Savollar"}
          </motion.button>
        </div>
      </div>

      {/* Accordion Content (Questions) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ padding: "1.5rem" }}
          >
            <div
              className="topic-questions-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.2rem",
              }}
            >
              {topicTests.map((test, index) => {
                const isLegacy = !Array.isArray(test.options);
                const optionsList = isLegacy
                  ? [
                      { id: "a", text: test.optionA, isCorrect: test.correctAnswer === test.optionA },
                      { id: "b", text: test.optionB, isCorrect: test.correctAnswer === test.optionB },
                      { id: "c", text: test.optionC, isCorrect: test.correctAnswer === test.optionC },
                    ].filter((o) => o.text)
                  : test.options || [];

                return (
                  <motion.div
                    key={test.id}
                    className={`test-item-card ${test.isActive === false ? "inactive" : ""}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: test.isActive === false ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "16px",
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      opacity: test.isActive === false ? 0.65 : 1,
                    }}
                  >
                    <div>
                      {/* Badge and Status */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            background: test.isActive === false ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                            color: test.isActive === false ? "#ef4444" : "#10b981",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: test.isActive === false ? "#ef4444" : "#10b981" }}></span>
                          {test.isActive === false ? "Yashirin" : "Faol (Yongan)"}
                        </span>

                        <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                          {formatDate(test.createdAt)}
                        </span>
                      </div>

                      {/* Question Image if present */}
                      {test.imageUrl && (
                        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                          <img
                            src={test.imageUrl}
                            alt="Savol rasmi"
                            style={{ maxHeight: "120px", maxWidth: "100%", borderRadius: "10px", objectFit: "cover" }}
                          />
                        </div>
                      )}

                      {/* Question Text */}
                      <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", fontWeight: "600", lineHeight: "1.4" }}>
                        {index + 1}. {test.question}
                      </h4>

                      {/* Options Preview */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1.2rem" }}>
                        {optionsList.map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: opt.isCorrect || opt.text === test.correctAnswer
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(255, 255, 255, 0.03)",
                              border: opt.isCorrect || opt.text === test.correctAnswer
                                ? "1px solid rgba(16, 185, 129, 0.4)"
                                : "1px solid rgba(255, 255, 255, 0.05)",
                              fontSize: "0.88rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              <strong>{String.fromCharCode(65 + oIdx)}:</strong> {opt.text}
                            </span>
                            {(opt.isCorrect || opt.text === test.correctAnswer) && (
                              <FiCheckCircle style={{ color: "#10b981", fontSize: "0.9rem" }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question Action Buttons (Tahrirlash & O'chirish) */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>

                      <button
                        type="button"
                        onClick={() => handleEditTest(test)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "10px",
                          background: "#6366f1",
                          color: "white",
                          border: "none",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <FiEdit2 /> Tahrirlash
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTest(test.id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "10px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                        title="Savolni Firebase'dan o'chirish"
                      >
                        <FiTrash2 /> O'chirish
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Audit Modal component
const AuditModal = ({ result, onClose }) => {
  if (!result) return null;

  const auditList = result.auditDetails || [];
  const pct = result.percentage || 0;
  const pctColor = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#181824",
          color: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "750px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "1rem",
          }}
        >
          <div>
            <span style={{ color: "#a855f7", fontWeight: "600", fontSize: "0.85rem" }}>
              🔍 O'quvchi Audit Tahlili
            </span>
            <h2 style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: "800" }}>
              {result.studentName}
            </h2>
            <p style={{ margin: "4px 0 0 0", opacity: 0.7, fontSize: "0.9rem" }}>
              Mavzu: <strong style={{ color: "#a855f7" }}>{result.topicName || "Umumiy Test"}</strong>
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: pctColor }}>
              {pct}%
            </div>
            <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
              {result.correctAnswers} / {result.totalQuestions} to'g'ri
            </span>
          </div>
        </div>

        {/* Audit details list */}
        <h3
          style={{
            fontSize: "1.1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiSearch style={{ color: "#6366f1" }} /> Savollar va Javoblar Auditi:
        </h3>

        {auditList.length === 0 ? (
          <p style={{ opacity: 0.6, textAlign: "center", padding: "2rem" }}>
            Savollar bo'yicha batafsil audit ma'lumotlari topilmadi.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {auditList.map((item, i) => (
              <div
                key={i}
                style={{
                  background: item.isCorrect
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(239, 68, 68, 0.08)",
                  border: item.isCorrect
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "16px",
                  padding: "1rem 1.2rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "0.95rem", flex: 1 }}>
                    {item.questionNumber || i + 1}. {item.question}
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      background: item.isCorrect
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                      color: item.isCorrect ? "#10b981" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.isCorrect ? <FiCheckCircle /> : <FiXCircle />}
                    {item.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "0.88rem",
                    marginTop: "8px",
                    background: "rgba(0,0,0,0.25)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <span style={{ opacity: 0.6, display: "block", fontSize: "0.75rem" }}>
                      O'quvchi javobi:
                    </span>
                    <strong style={{ color: item.isCorrect ? "#10b981" : "#ef4444" }}>
                      {item.userAnswer}
                    </strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, display: "block", fontSize: "0.75rem" }}>
                      To'g'ri javob:
                    </span>
                    <strong style={{ color: "#10b981" }}>{item.correctAnswer}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Close Button */}
        <div style={{ marginTop: "1.8rem", textAlign: "right" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Yopish
          </button>
        </div>
      </motion.div>
    </div>
  );
};
