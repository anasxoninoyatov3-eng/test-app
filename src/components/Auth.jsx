import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
  FaUserShield,
  FaKey,
  FaInfoCircle,
} from "react-icons/fa";
import "../styles/Auth.css";

const Auth = ({ onClose }) => {
  const navigate = useNavigate();
  const { loginUserWithNickname, loginAdmin, ADMIN_PASSWORD, USER_COMMON_PASSWORD } =
    useAuth();

  const [activeTab, setActiveTab] = useState("user"); // 'user' | 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({
    nickname: "",
    password: "",
  });

  const [adminForm, setAdminForm] = useState({
    email: "admin@testapp.uz",
    password: "",
  });

  const handleAuthSuccess = (isUserAdmin) => {
    setSuccess("Muvaffaqiyatli amalga oshirildi!");
    setTimeout(() => {
      onClose();
      if (isUserAdmin) {
        navigate("/admin");
      } else {
        navigate("/test-selection");
      }
    }, 1000);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userForm.nickname.trim()) {
      setError("Iltimos, Nickname (Taxallus) kiriting!");
      return;
    }
    if (!userForm.password) {
      setError("Foydalanuvchilar uchun maxsus parolni kiriting!");
      return;
    }

    setLoading(true);
    try {
      await loginUserWithNickname({
        nickname: userForm.nickname,
        password: userForm.password,
      });
      handleAuthSuccess(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!adminForm.password) {
      setError("Admin panelining shifrlangan maxsus parolini kiriting!");
      return;
    }

    setLoading(true);
    try {
      await loginAdmin({
        email: adminForm.email,
        password: adminForm.password,
      });
      handleAuthSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h2>Tizimga kirish</h2>
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "user" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("user");
                setError("");
                setSuccess("");
              }}
            >
              <FaUser style={{ marginRight: "6px" }} /> Foydalanuvchi
            </button>
            <button
              className={`auth-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("admin");
                setError("");
                setSuccess("");
              }}
            >
              <FaUserShield style={{ marginRight: "6px" }} /> Admin Panel
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

          {/* USER LOGIN FORM */}
          {activeTab === "user" && (
            <form className="auth-form" onSubmit={handleUserSubmit}>
              <div className="input-group">
                <label>Sizning Nickname (Ism / Taxallus)</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Masalan: Jasur, Madina, User1..."
                    value={userForm.nickname}
                    onChange={(e) =>
                      setUserForm({ ...userForm, nickname: e.target.value })
                    }
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Foydalanuvchilar maxsus paroli</label>
                <div className="input-wrapper">
                  <FaKey className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parolni kiriting..."
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    disabled={loading}
                    autoComplete="current-password"
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



              <motion.button
                type="submit"
                className="submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="spinner"></span> : "Test Yechishga Kirish"}
              </motion.button>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === "admin" && (
            <form className="auth-form" onSubmit={handleAdminSubmit}>
              <div className="input-group">
                <label>Admin Login / Email</label>
                <div className="input-wrapper">
                  <FaUserShield className="input-icon" />
                  <input
                    type="text"
                    placeholder="admin@testapp.uz"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Shifrlangan Qiyin Admin Paroli</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parolni kiriting..."
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                    disabled={loading}
                    autoComplete="current-password"
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



              <motion.button
                type="submit"
                className="submit-btn admin-submit-btn"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="spinner"></span> : "Admin Panelga Kirish"}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Auth;
