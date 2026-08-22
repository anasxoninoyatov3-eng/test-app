import { useNavigate } from "react-router-dom";
import { useTest } from "../contexts/TestContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaArrowLeft,
  FaArrowRight,
  FaFileAlt,
  FaFrown,
  FaMeh,
  FaMoon,
  FaSmile,
  FaSun,
  FaBookOpen,
  FaCheckCircle,
} from "react-icons/fa";
import "../styles/TestSelection.css";

const TestSelection = () => {
  const navigate = useNavigate();
  const { tests, isLoadingTests, getTestCategories, startTestByCategory, startTest } = useTest();
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
      alert("Ushbu test to'plamida yoqilgan testlar topilmadi!");
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

        <h1 className="selection-title">Mavjud Testlar Ro'yxati</h1>

        <button className="theme-toggle-selection" onClick={toggleTheme}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>
      </header>

      {/* Main Content */}
      <main className="selection-main animate-fade-in-up">
        <div className="selection-content">
          <div className="selection-description">
            <h2>Admin tomonidan yoqilgan test to'plamlari</h2>
            <p>O'zingizga ma'qul bo'lgan testni tanlang va bilimingizni sinab ko'ring</p>
          </div>

          <div className="difficulty-cards">
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <div
                  key={cat.name || index}
                  className="difficulty-card animate-bounce-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="card-header-selection">
                    <div
                      className="difficulty-icon"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                    >
                      <FaBookOpen />
                    </div>
                    <h3 className="difficulty-name">{cat.name}</h3>
                  </div>

                  <div className="card-content">
                    <div className="test-count">
                      <span className="count-number">{cat.questions.length}</span>
                      <span className="count-label">ta savol</span>
                    </div>

                    <div className="difficulty-description" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "#10b981", fontWeight: "600" }}>
                      <FaCheckCircle /> Admin yoqqan (Faol)
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="start-test-btn"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
                      onClick={() => handleStartCategory(cat.name)}
                    >
                      Testni Boshlash
                      <span className="btn-arrow">
                        <FaArrowRight />
                      </span>
                    </button>
                  </div>

                  <div className="card-glow"></div>
                </div>
              ))
            ) : (
              // Fallback to traditional difficulty cards if no specific categories exist
              [
                { key: "easy", name: "Oson Testlar", icon: <FaSmile />, color: "var(--gradient-accent)" },
                { key: "medium", name: "O'rtacha Testlar", icon: <FaMeh />, color: "var(--gradient-primary)" },
                { key: "hard", name: "Qiyin Testlar", icon: <FaFrown />, color: "var(--gradient-secondary)" },
              ].map((diff, index) => {
                const count = (tests[diff.key] || []).filter((t) => t.isActive !== false).length;
                return (
                  <div
                    key={diff.key}
                    className="difficulty-card animate-bounce-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="card-header-selection">
                      <div className="difficulty-icon" style={{ background: diff.color }}>
                        {diff.icon}
                      </div>
                      <h3 className="difficulty-name">{diff.name}</h3>
                    </div>

                    <div className="card-content">
                      <div className="test-count">
                        <span className="count-number">{count}</span>
                        <span className="count-label">ta test</span>
                      </div>

                      <div className="difficulty-description">
                        Barcha yoqilgan savollar to'plami
                      </div>
                    </div>

                    <div className="card-footer">
                      <button
                        className="start-test-btn"
                        style={{ background: diff.color }}
                        onClick={() => {
                          const started = startTest(diff.key);
                          if (started) {
                            navigate(`/test/${diff.key}`);
                          } else {
                            alert("Bu bo'limda faol testlar mavjud emas!");
                          }
                        }}
                      >
                        Testni Boshlash
                        <span className="btn-arrow">
                          <FaArrowRight />
                        </span>
                      </button>
                    </div>

                    <div className="card-glow"></div>
                  </div>
                );
              })
            )}
          </div>

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
