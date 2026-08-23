import { useNavigate } from "react-router-dom";
import { useTest } from "../contexts/TestContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaArrowLeft,
  FaArrowRight,
  FaFileAlt,
  FaMoon,
  FaSun,
  FaBookOpen,
  FaPlayCircle,
  FaListAlt,
} from "react-icons/fa";
import "../styles/TestSelection.css";

const TestSelection = () => {
  const navigate = useNavigate();
  const { tests, isLoadingTests, getTestCategories, startTestByCategory } = useTest();
  const { theme, toggleTheme } = useTheme();

  const categories = getTestCategories ? getTestCategories() : [];

  const handleStartCategory = (categoryName) => {
    if (isLoadingTests) {
      alert("Testlar yuklanmoqda, biroz kuting...");
      return;
    }
    const started = startTestByCategory(categoryName);
    if (started) {
      navigate(`/test/${encodeURIComponent(categoryName)}`);
    } else {
      alert("Ushbu mavzuda faol testlar topilmadi!");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="test-selection-container">
      {/* Background Animation */}
      <div className="selection-background">
        <div className="selection-shapes">
          <div className="selection-shape selection-shape-1"></div>
          <div className="selection-shape selection-shape-2"></div>
          <div className="selection-shape selection-shape-3"></div>
          <div className="selection-shape selection-shape-4"></div>
        </div>
      </div>

      {/* Header */}
      <header className="selection-header animate-slide-in-top">
        <button className="back-btn-selection" onClick={handleBack}>
          <span className="back-icon">
            <FaArrowLeft />
          </span>
          <span className="back-text">Orqaga</span>
        </button>

        <h1 className="selection-title">Mavzular Ro'yxati</h1>

        <button className="theme-toggle-selection" onClick={toggleTheme}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>
      </header>

      {/* Main Content */}
      <main className="selection-main animate-fade-in-up">
        <div className="selection-content">
          <div className="selection-description">
            <h2>Test mavzusini tanlang</h2>
            <p>O'zingizga mos mavzuni tanlab, bilimingizni sinab ko'ring</p>
          </div>

          {/* Loading state */}
          {isLoadingTests && (
            <div className="topics-loading">
              <div className="topic-loading-spinner"></div>
              <p>Mavzular yuklanmoqda...</p>
            </div>
          )}

          {/* Category cards */}
          {!isLoadingTests && categories.length > 0 && (
            <div className="topics-grid">
              {categories.map((cat, index) => (
                <div
                  key={cat.name || index}
                  className="topic-card animate-bounce-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleStartCategory(cat.name)}
                >
                  {/* Card image area */}
                  <div className="topic-card-image">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="topic-img" />
                    ) : (
                      <div className="topic-img-placeholder">
                        <FaBookOpen className="placeholder-icon" />
                      </div>
                    )}
                    {/* Topic badge */}
                    <div className="topic-count-badge">
                      <FaListAlt className="badge-icon" />
                      <span>{cat.questions.length} ta savol</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="topic-card-body">
                    <h3 className="topic-name">{cat.name}</h3>

                    <div className="topic-meta">
                      <div className="topic-questions-info">
                        <div className="questions-count-display">
                          <span className="count-big">{cat.questions.length}</span>
                          <span className="count-unit">ta savol</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="topic-start-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCategory(cat.name);
                      }}
                    >
                      <FaPlayCircle className="start-icon" />
                      Testni Boshlash
                      <FaArrowRight className="arrow-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No tests message */}
          {!isLoadingTests &&
            categories.length === 0 &&
            Object.values(tests).every((difficulty) => difficulty.length === 0) && (
              <div className="no-tests-message animate-fade-in-up">
                <div className="no-tests-icon">
                  <FaFileAlt />
                </div>
                <h3>Hali yoqilgan testlar mavjud emas</h3>
                <p>Admin panel orqali testlarni yoqing yoki yangi test qo'shing</p>
                <button
                  className="go-admin-btn"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panelga O'tish
                </button>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default TestSelection;
