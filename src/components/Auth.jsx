import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
} from "react-icons/fa";
import "../styles/Auth.css";

// Official 4-color Google Icon SVG
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="google-svg-logo">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const Auth = ({ onClose }) => {
  const navigate = useNavigate();
  const { signInWithGoogle, registerWithCredentials, loginWithCredentials } =
    useAuth();

  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleAuthSuccess = (user) => {
    setSuccess("Muvaffaqiyatli amalga oshirildi!");
    const isAdminUser =
      user?.email === "anasxoninoyatov3@gmail.com"  ||
      user?.isAdmin;

    setTimeout(() => {
      onClose();
      if (isAdminUser) {
        navigate("/admin");
      } else {
        navigate("/test-selection");
      }
    }, 1200);
  };

  // Google Login (OAuth 2.0 without Firebase Auth)
  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      handleAuthSuccess(result.user);
    } catch (err) {
      setError(err.message || "Google orqali kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Submit Form (Input-based Auth)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (activeTab === "register") {
      if (!formData.name.trim()) {
        setError("Ismingizni kiriting!");
        return;
      }
      if (!formData.email.trim()) {
        setError("Email manzilingizni kiriting!");
        return;
      }
      if (!formData.password) {
        setError("Parol kiriting!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Parollar bir-biriga mos kelmadi!");
        return;
      }

      setLoading(true);
      try {
        const result = await registerWithCredentials({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        handleAuthSuccess(result.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      if (!formData.email.trim()) {
        setError("Email manzilingizni kiriting!");
        return;
      }
      if (!formData.password) {
        setError("Parolingizni kiriting!");
        return;
      }

      setLoading(true);
      try {
        const result = await loginWithCredentials({
          email: formData.email,
          password: formData.password,
        });
        handleAuthSuccess(result.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div
      className="auth-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="auth-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose} aria-label="Yopish">
          <FaTimes />
        </button>

        {/* Modal Header with Clean Tabs */}
        <div className="auth-header">
          <h2>
            {activeTab === "login" ? "Tizimga kirish" : "Ro'yxatdan o'tish"}
          </h2>
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setError("");
                setSuccess("");
              }}
            >
              Kirish
            </button>
            <button
              className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                setError("");
                setSuccess("");
              }}
            >
              Ro'yxatdan o'tish
            </button>
          </div>
        </div>

        <div className="auth-body">
          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="auth-message error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <FaExclamationCircle className="msg-icon" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="auth-message success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <FaCheckCircle className="msg-icon" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {activeTab === "register" && (
              <div className="input-group">
                <label>Ismingiz va familiyangiz</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Ism va familiya"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Email manzil</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="misol@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Parol</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete={
                    activeTab === "login" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {activeTab === "register" && (
              <div className="input-group">
                <label>Parolni tasdiqlash</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              className="submit-btn"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : activeTab === "login" ? (
                "Kirish"
              ) : (
                "Ro'yxatdan o'tish"
              )}
            </motion.button>
          </form>

          {/* Social Divider */}
          <div className="social-divider">
            <span>yoki</span>
          </div>

          {/* Google OAuth 2.0 Button with Official 4-Color Logo */}
          <motion.button
            type="button"
            className="social-btn google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <GoogleLogo />
            <span>Google orqali kirish</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Auth;
