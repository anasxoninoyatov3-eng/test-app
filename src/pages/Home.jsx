import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import Auth from "../components/Auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBolt,
  FaBrain,
  FaChartLine,
  FaCog,
  FaDoorOpen,
  FaFileAlt,
  FaGraduationCap,
  FaLaptopCode,
  FaLock,
  FaMoon,
  FaSun,
  FaUserCircle,
  FaPlusCircle,
} from "react-icons/fa";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const isUserAdmin = typeof isAdmin === "function" ? isAdmin() : false;
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = () => {
    if (currentUser) {
      logout();
    } else {
      setShowAuth(true);
    }
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate("/profile");
    } else {
      setShowAuth(true);
    }
  };

  const handleAdminPanelClick = () => {
    if (currentUser) {
      navigate("/admin");
    } else {
      setShowAuth(true);
    }
  };

  const handleTestSolving = () => {
    if (currentUser) {
      navigate("/test-selection");
    } else {
      setShowAuth(true);
    }
  };

  return (
    <div className="home-container">
      {/* Background Animated Glow Blobs */}
      <div className="background-animation">
        <div className="glow-blob blob-1"></div>
        <div className="glow-blob blob-2"></div>
        <div className="glow-blob blob-3"></div>
      </div>

      {/* Modern Header Nav */}
      <header className="home-header">
        <div className="brand-logo" onClick={() => navigate("/")}>
          <div className="logo-icon">
            <FaGraduationCap />
          </div>
          <span className="logo-text">Test App</span>
        </div>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === "light" ? "Tungi rejim" : "Kungi rejim"}
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>

          {currentUser ? (
            <div className="user-nav-group">
              <button
                className="profile-quick-btn"
                onClick={handleProfileClick}
                title="Profilga o'tish"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="nav-avatar-img"
                  />
                ) : (
                  <div className="nav-avatar-fallback">
                    {(currentUser.firstName || currentUser.username || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="nav-user-name">
                  {currentUser.firstName || currentUser.username || "Foydalanuvchi"}
                </span>
              </button>

              <button
                className="account-btn logout-btn"
                onClick={handleLogout}
                title="Tizimdan chiqish"
              >
                <FaDoorOpen />
                <span>Chiqish</span>
              </button>
            </div>
          ) : (
            <button className="account-btn login-nav-btn" onClick={handleLogout}>
              <FaLock />
              <span>Tizimga kirish</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="home-content">
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge">
            <FaBrain className="badge-icon" />
            <span>Aqlli Bilim Platformasi</span>
          </div>

          <h1 className="main-title">
            Bilimingizni sinang va <br />
            <span className="highlight-text">Cho'qqilarga erishing</span>
          </h1>

          <p className="subtitle">
            Zamonaviy va interaktiv testlar orqali bilimlaringizni oshiring,
            natijalarni tahlil qiling va rivojlaning.
          </p>

          {/* Action Buttons */}
          <div className="action-buttons">
            {currentUser ? (
              <>
                <motion.button
                  className="action-btn primary-btn"
                  onClick={handleProfileClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaUserCircle className="btn-icon" />
                  <span>Mening Profilim</span>
                </motion.button>

                <motion.button
                  className="action-btn secondary-btn"
                  onClick={handleTestSolving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaFileAlt className="btn-icon" />
                  <span>Test Yechish</span>
                </motion.button>

                {isUserAdmin && (
                  <motion.button
                    className="action-btn create-test-btn"
                    onClick={handleAdminPanelClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlusCircle className="btn-icon" />
                    <span>Admin Panel</span>
                  </motion.button>
                )}
              </>
            ) : (
              <>
                <motion.button
                  className="action-btn primary-btn"
                  onClick={() => setShowAuth(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaLock className="btn-icon" />
                  <span>Tizimga kirish</span>
                </motion.button>

                <motion.button
                  className="action-btn secondary-btn"
                  onClick={handleTestSolving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaFileAlt className="btn-icon" />
                  <span>Test Yechish</span>
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* 3 Main Feature Cards with Updated Uzbek Texts */}
        <motion.div
          className="features-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Card 1 */}
          <motion.div
            className="feature-card"
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon icon-cyan">
              <FaGraduationCap />
            </div>
            <h3>Interaktiv Testlar</h3>
            <p>
              Har xil qiyinchilikdagi va fanlar bo'yicha sara savollar to'plami
              bilan bilimingizni oshiring.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="feature-card"
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon icon-purple">
              <FaChartLine />
            </div>
            <h3>Tezkor Tahlil & Statistika</h3>
            <p>
              Test yakunlanishi bilanoq xatolaringiz va erishgan
              natijalaringizni aniq ko'rib boring.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            className="feature-card"
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon icon-emerald">
              <FaLaptopCode />
            </div>
            <h3>Zamonaviy & Qulay Platforma</h3>
            <p>
              Har qanday kompyuter yoki mobil qurilmada tez va qulay test yechish
              imkoniyati.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer - Clean, stylish & copyright sentence completely removed */}
      <footer className="home-footer">
        <div className="footer-status-pill">
          <span className="status-dot"></span>
          <span>Test Platformasi online rejimda ishlamoqda</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Home;
