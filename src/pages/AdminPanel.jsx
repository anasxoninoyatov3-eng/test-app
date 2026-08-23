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
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { addTest, editTest, deleteTest, toggleTestStatus, tests, isLoadingTests } = useTest();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

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
    if (window.confirm("Bu testni o'chirishni xohlaysizmi?")) {
      await deleteTest(testId);
      setMessage("Test muvaffaqiyatli o'chirildi!");
      setTimeout(() => setMessage(""), 3000);
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
            <FiUsers className="tab-icon" />
            Testlarni Boshqarish
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
          {activeTab === "manage" && (
            <motion.div
              key="manage"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="admin-card manage-tests-card"
            >
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FiUsers />
                </motion.div>
                <h2>Testlarni Boshqarish</h2>
                <p>Mavjud testlarni ko'rish, tahrirlash va o'chirish</p>
              </div>

              <div className="tests-section">
                <div className="tests-header">
                  <h3>Mavjud Testlar</h3>
                  <motion.button
                    className="toggle-tests-btn"
                    onClick={toggleShowTests}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiEye className="btn-icon" />
                    {showTests ? "Yashirish" : "Ko'rsatish"}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showTests && (
                    <motion.div
                      className="tests-list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {isLoadingTests ? (
                        <div className="loading-state">
                          <motion.div
                            className="loading-spinner large"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <p>Yuklanmoqda...</p>
                        </div>
                      ) : (() => {
                          // Group tests by testName (topic)
                          const allTestsList = Object.values(tests).flat();
                          const topicMap = {};
                          allTestsList.forEach((t) => {
                            const name = t.testName || "Umumiy Test";
                            if (!topicMap[name]) topicMap[name] = [];
                            topicMap[name].push(t);
                          });
                          const topicEntries = Object.entries(topicMap);
                          if (topicEntries.length === 0) {
                            return (
                              <div className="no-tests">
                                <FiBookOpen className="no-tests-icon" />
                                <p>Hali testlar qo'shilmagan</p>
                              </div>
                            );
                          }
                          return topicEntries.map(([topicName, topicTests]) => (
                            <motion.div
                              key={topicName}
                              className="difficulty-section"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                            >
                              <h4 className="difficulty-title">
                                <FiBookOpen className="difficulty-icon easy" />
                                <span>{topicName}</span>
                                <span className="test-count">
                                  ({topicTests.length} ta savol)
                                </span>
                              </h4>

                              <div className="tests-grid">
                                  {topicTests.map((test, index) => (
                                    <motion.div
                                      key={test.id}
                                      className="test-card"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        duration: 0.4,
                                        delay: index * 0.1,
                                      }}
                                      whileHover={{ y: -8, scale: 1.02 }}
                                      layout
                                    >
                                      <div className="test-content">
                                        <div className="test-header">
                                          <h5 className="test-question">
                                            {test.question}
                                          </h5>
                                           <span style={{ fontSize: "0.8rem", fontWeight: "bold", padding: "3px 10px", borderRadius: "12px", backgroundColor: test.isActive !== false ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: test.isActive !== false ? "#10b981" : "#ef4444", border: test.isActive !== false ? "1px solid #10b981" : "1px solid #ef4444" }}>{test.isActive !== false ? "🟢 Faol (Yongan)" : "🔴 Nofaol (O\'chirilgan)"}</span>
                                          <div
                                            className="difficulty-badge"
                                            style={{
                                              backgroundColor:
                                                getDifficultyColor(
                                                  test.difficulty
                                                ),
                                            }}
                                          >
                                            {getDifficultyIcon(test.difficulty)}
                                          </div>
                                        </div>

                                        <div className="test-options">
                                          {Array.isArray(test.options) &&
                                          test.options.length
                                            ? test.options.map((o, i) => (
                                                <div
                                                  className="option"
                                                  key={o.id || i}
                                                >
                                                  <span className="option-label">
                                                    {String.fromCharCode(
                                                      65 + i
                                                    )}
                                                    :
                                                  </span>
                                                  <span className="option-text">
                                                    {o.text}
                                                  </span>
                                                  {o.isCorrect && (
                                                    <FiCheckCircle className="correct-indicator" />
                                                  )}
                                                </div>
                                              ))
                                            : [
                                                test.optionA,
                                                test.optionB,
                                                test.optionC,
                                              ]
                                                .filter(Boolean)
                                                .map((t, i) => (
                                                  <div
                                                    className="option"
                                                    key={i}
                                                  >
                                                    <span className="option-label">
                                                      {String.fromCharCode(
                                                        65 + i
                                                      )}
                                                      :
                                                    </span>
                                                    <span className="option-text">
                                                      {t}
                                                    </span>
                                                  </div>
                                                ))}
                                        </div>

                                        <div className="test-info">
                                          <span className="correct-answer">
                                            <FiCheckCircle className="info-icon" />
                                            To'g'ri: {test.correctAnswer}
                                          </span>
                                          <span className="test-date">
                                            {formatDate(test.createdAt)}
                                          </span>
                                        </div>

                                        <div className="test-actions">
                                           <motion.button className="status-toggle-btn" onClick={() => toggleTestStatus(test.id, test.isActive !== false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700", border: "none", cursor: "pointer", backgroundColor: test.isActive !== false ? "#ef4444" : "#10b981", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>{test.isActive !== false ? "Yashirish 🔴" : "Ko'rsatish 🟢"}</motion.button>
                                          <motion.button
                                            className="edit-btn"
                                            onClick={() => handleEditTest(test)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <FiEdit2 className="btn-icon" />
                                            Tahrirlash
                                          </motion.button>

                                          <motion.button
                                            className="delete-btn"
                                            onClick={() =>
                                              handleDeleteTest(test.id)
                                            }
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <FiTrash2 className="btn-icon" />
                                            O'chirish
                                          </motion.button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                            </motion.div>
                          ));
                        })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
    </div>
  );
};

export default AdminPanel;
