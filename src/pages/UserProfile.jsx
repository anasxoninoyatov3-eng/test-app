import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaEdit,
  FaMoon,
  FaPen,
  FaSave,
  FaSun,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import "../styles/UserProfile.css";

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [editingField, setEditingField] = useState(null); // 'username' | 'firstName' | 'lastName' | 'age' | 'all' | null
  const [editData, setEditData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    age: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (userProfile || currentUser) {
      setEditData({
        username: userProfile?.username || currentUser?.username || "",
        firstName: userProfile?.firstName || currentUser?.firstName || "",
        lastName: userProfile?.lastName || currentUser?.lastName || "",
        age: userProfile?.age || currentUser?.age || "",
      });
    }
  }, [userProfile, currentUser]);

  const handleStartEditField = (fieldKey) => {
    setEditingField(fieldKey);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({
        username: editData.username,
        firstName: editData.firstName,
        lastName: editData.lastName,
        age: editData.age,
      });
      setEditingField(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Profilni saqlashda xatolik:", err);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditData({
      username: userProfile?.username || currentUser?.username || "",
      firstName: userProfile?.firstName || currentUser?.firstName || "",
      lastName: userProfile?.lastName || currentUser?.lastName || "",
      age: userProfile?.age || currentUser?.age || "",
    });
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleTestSelection = () => {
    navigate("/test-selection");
  };

  if (!currentUser) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Profil yuklanmoqda...</p>
      </div>
    );
  }

  const isAnyFieldEditing = editingField !== null;

  return (
    <div className="profile-container">
      {/* Background Animation */}
      <div className="profile-background">
        <div className="profile-shapes">
          <div className="profile-shape profile-shape-1"></div>
          <div className="profile-shape profile-shape-2"></div>
          <div className="profile-shape profile-shape-3"></div>
        </div>
      </div>

      {/* Header */}
      <header className="profile-header">
        <button className="back-btn-profile" onClick={handleBack}>
          <span className="back-icon">
            <FaArrowLeft />
          </span>
          <span className="back-text">Orqaga</span>
        </button>

        <h1 className="profile-title">Foydalanuvchi Profili</h1>

        <button className="theme-toggle-profile" onClick={toggleTheme}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="profile-header-section">
            <div className="profile-avatar">
              {(editData.firstName || editData.username || currentUser.email || "U")[0].toUpperCase()}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">
                {editData.firstName && editData.lastName
                  ? `${editData.firstName} ${editData.lastName}`
                  : editData.username || "Foydalanuvchi"}
              </h2>
              <p className="profile-email">{currentUser.email}</p>
              {(userProfile?.provider || currentUser.provider) && (
                <span className="provider-badge">
                  {userProfile?.provider || currentUser.provider}
                </span>
              )}
            </div>
          </div>

          {/* Success Notification */}
          {saveSuccess && (
            <motion.div
              className="profile-save-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <FaCheck /> Ma'lumotlar muvaffaqiyatli saqlandi!
            </motion.div>
          )}

          {/* Profile Details with Edit Buttons on ALL Fields */}
          <div className="profile-details">
            {/* USERNAME */}
            <div className="detail-item">
              <FaUser className="detail-icon" />
              <div className="detail-content">
                <label>USERNAME</label>
                {editingField === "username" || editingField === "all" ? (
                  <input
                    type="text"
                    name="username"
                    value={editData.username}
                    onChange={handleInputChange}
                    placeholder="Usernameni kiriting"
                    autoFocus
                  />
                ) : (
                  <span>{editData.username || "Kiritilmagan"}</span>
                )}
              </div>
              <button
                className="field-edit-btn"
                onClick={() =>
                  editingField === "username"
                    ? handleSave()
                    : handleStartEditField("username")
                }
                title="USERNAME ni tahrirlash"
              >
                {editingField === "username" ? <FaCheck className="save-icon" /> : <FaEdit />}
              </button>
            </div>

            {/* ISM (FIRSTNAME) */}
            <div className="detail-item">
              <FaUser className="detail-icon" />
              <div className="detail-content">
                <label>ISM</label>
                {editingField === "firstName" || editingField === "all" ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleInputChange}
                    placeholder="Ismingizni kiriting"
                    autoFocus
                  />
                ) : (
                  <span>{editData.firstName || "Kiritilmagan"}</span>
                )}
              </div>
              <button
                className="field-edit-btn"
                onClick={() =>
                  editingField === "firstName"
                    ? handleSave()
                    : handleStartEditField("firstName")
                }
                title="Ismni tahrirlash"
              >
                {editingField === "firstName" ? <FaCheck className="save-icon" /> : <FaEdit />}
              </button>
            </div>

            {/* FAMILIYA (LASTNAME) */}
            <div className="detail-item">
              <FaUser className="detail-icon" />
              <div className="detail-content">
                <label>FAMILIYA</label>
                {editingField === "lastName" || editingField === "all" ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleInputChange}
                    placeholder="Familiyangizni kiriting"
                    autoFocus
                  />
                ) : (
                  <span>{editData.lastName || "Kiritilmagan"}</span>
                )}
              </div>
              <button
                className="field-edit-btn"
                onClick={() =>
                  editingField === "lastName"
                    ? handleSave()
                    : handleStartEditField("lastName")
                }
                title="Familiyani tahrirlash"
              >
                {editingField === "lastName" ? <FaCheck className="save-icon" /> : <FaEdit />}
              </button>
            </div>

            {/* YOSH (AGE) */}
            <div className="detail-item">
              <FaCalendar className="detail-icon" />
              <div className="detail-content">
                <label>YOSH</label>
                {editingField === "age" || editingField === "all" ? (
                  <input
                    type="number"
                    name="age"
                    value={editData.age}
                    onChange={handleInputChange}
                    placeholder="Yoshni kiriting"
                    min="1"
                    max="120"
                    autoFocus
                  />
                ) : (
                  <span>
                    {editData.age ? `${editData.age} yosh` : "Kiritilmagan"}
                  </span>
                )}
              </div>
              <button
                className="field-edit-btn"
                onClick={() =>
                  editingField === "age"
                    ? handleSave()
                    : handleStartEditField("age")
                }
                title="Yoshni tahrirlash"
              >
                {editingField === "age" ? <FaCheck className="save-icon" /> : <FaEdit />}
              </button>
            </div>

            {/* EMAIL (Read-only) */}
            <div className="detail-item readonly-item">
              <FaEnvelope className="detail-icon" />
              <div className="detail-content">
                <label>EMAIL</label>
                <span>{currentUser.email}</span>
              </div>
            </div>

            {/* RO'YXATDAN O'TGAN SANA (Read-only) */}
            <div className="detail-item readonly-item">
              <FaCalendar className="detail-icon" />
              <div className="detail-content">
                <label>RO'YXATDAN O'TGAN SANA</label>
                <span>
                  {userProfile?.createdAt || currentUser?.createdAt
                    ? new Date(
                        userProfile?.createdAt || currentUser?.createdAt
                      ).toLocaleDateString("uz-UZ")
                    : "Ma'lum emas"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {isAnyFieldEditing ? (
              <div className="edit-actions">
                <motion.button
                  className="action-btn save-btn"
                  onClick={handleSave}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaSave />
                  Barchasini saqlash
                </motion.button>
                <motion.button
                  className="action-btn cancel-btn"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaTimes />
                  Bekor qilish
                </motion.button>
              </div>
            ) : (
              <motion.button
                className="action-btn edit-btn"
                onClick={() => handleStartEditField("all")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaEdit />
                Barchasini tahrirlash
              </motion.button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <motion.button
              className="quick-action-btn test-btn"
              onClick={handleTestSelection}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaPen />
              Test Yechish
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UserProfile;
