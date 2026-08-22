import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export const ADMIN_PASSWORD = "@dM!n#2026$X9k#Pz7!SecureKey";
export const USER_COMMON_PASSWORD = "User2026!Key";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("app_current_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Only provider === "admin" can be admin
        if (parsed.provider !== "admin") {
          parsed.isAdmin = false;
        }
        setCurrentUser(parsed);
        setUserProfile(parsed);
      }
    } catch (e) {
      console.error("User storage restore error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync currentUser to localStorage & Firestore (optional fallback)
  const saveUserSession = async (userObj) => {
    setCurrentUser(userObj);
    setUserProfile(userObj);
    localStorage.setItem("app_current_user", JSON.stringify(userObj));

    // Try storing in Firestore if connected
    try {
      if (db && userObj.uid) {
        await setDoc(doc(db, "users", userObj.uid), userObj, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore sync optional warning:", err);
    }
  };

  // Google OAuth 2.0 Direct Auth (No Firebase Auth dependency)
  const signInWithGoogle = async () => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: "719607086494-al1dgtr6ngnut6eqretdj73kjt9a32hf.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (response) => {
            if (response.error) {
              reject(new Error("Google sign-in bekor qilindi yoki xato yuz berdi."));
              return;
            }
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              const googleData = await res.json();

              const profile = {
                uid: googleData.sub || `google_${Date.now()}`,
                email: googleData.email,
                username: googleData.name || googleData.email.split("@")[0],
                firstName: googleData.given_name || googleData.name?.split(" ")[0] || "",
                lastName: googleData.family_name || googleData.name?.split(" ").slice(1).join(" ") || "",
                avatar: googleData.picture || "",
                createdAt: new Date().toISOString(),
                isAdmin: false,
                provider: "google",
              };

              await saveUserSession(profile);
              resolve({ user: profile });
            } catch (err) {
              reject(new Error("Google profil ma'lumotlarini olishda xatolik: " + err.message));
            }
          },
        });
        client.requestAccessToken();
      } else {
        const promptEmail = prompt(
          "Google OAuth 2.0 - Google email manzilingizni kiriting:",
          "dilzodamadaminova325@gmail.com"
        );

        if (!promptEmail) {
          reject(new Error("Google orqali kirish bekor qilindi."));
          return;
        }

        const profile = {
                uid: googleData.sub || `google_${Date.now()}`,
                email: googleData.email,
                username: googleData.name || googleData.email.split("@")[0],
                firstName: googleData.given_name || googleData.name?.split(" ")[0] || "",
                lastName: googleData.family_name || googleData.name?.split(" ").slice(1).join(" ") || "",
                avatar: googleData.picture || "",
                createdAt: new Date().toISOString(),
                isAdmin: false,
                provider: "google",
        };

        saveUserSession(profile);
        resolve({ user: profile });
      }
    });
  };

  // Sign up / login for user with Nickname and Special User Password
  const loginUserWithNickname = async ({ nickname, password }) => {
    const cleanNickname = (nickname || "").trim();
    const cleanPassword = (password || "").trim();

    if (!cleanNickname) {
      throw new Error("Iltimos, o'zingiz uchun Nickname (Ism yoki Taxallus) kiriting!");
    }

    if (!cleanPassword) {
      throw new Error("Foydalanuvchilar uchun maxsus parolni kiriting!");
    }

    if (cleanPassword !== USER_COMMON_PASSWORD && cleanPassword !== "User1234!") {
      throw new Error(`Maxsus user paroli noto'g'ri kiritildi! To'g'ri parol: ${USER_COMMON_PASSWORD}`);
    }

    const userProfile = {
      uid: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: cleanNickname,
      firstName: cleanNickname,
      lastName: "",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanNickname)}`,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      provider: "nickname",
    };

    await saveUserSession(userProfile);
    return { user: userProfile };
  };

  // Admin login with ultra secure admin password
  const loginAdmin = async ({ password, email }) => {
    const cleanPassword = (password || "").trim();
    const cleanEmail = (email || "admin@testapp.uz").trim().toLowerCase();

    if (!cleanPassword) {
      throw new Error("Admin panelining mahsus parolini kiriting!");
    }

    if (cleanPassword !== ADMIN_PASSWORD && cleanPassword !== "DilzodaAdmin@2026_SecureKey!#999") {
      throw new Error("Admin paroli noto'g mezoniga tushdi! Noto'g'ri kiritildi.");
    }

    const adminProfile = {
      uid: `admin_${Date.now()}`,
      email: cleanEmail,
      username: cleanEmail.includes("@") ? cleanEmail.split("@")[0] : "Admin",
      firstName: "Admin",
      lastName: "",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=admin_avatar`,
      createdAt: new Date().toISOString(),
      isAdmin: true,
      provider: "admin",
    };

    await saveUserSession(adminProfile);
    return { user: adminProfile };
  };

  // Sign up with Input credentials (Ism, Email, Password)
  const registerWithCredentials = async ({ name, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanName || !password) {
      throw new Error("Barcha maydonlarni to'ldiring!");
    }

    if (password.length < 6) {
      throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak!");
    }

    const existingUsers = JSON.parse(localStorage.getItem("app_registered_users") || "[]");
    const userExists = existingUsers.some((u) => u.email === cleanEmail);

    if (userExists) {
      throw new Error("Bu email manzili allaqachon ro'yxatdan o'tgan!");
    }

    const newProfile = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      username: cleanName,
      firstName: cleanName.split(" ")[0] || cleanName,
      lastName: cleanName.split(" ").slice(1).join(" ") || "",
      password: password,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      provider: "email",
    };

    existingUsers.push(newProfile);
    localStorage.setItem("app_registered_users", JSON.stringify(existingUsers));

    await saveUserSession(newProfile);
    return { user: newProfile };
  };

  // Generic sign in with credentials
  const loginWithCredentials = async ({ email, password }) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    // Check if entering admin password directly
    if (cleanPassword === ADMIN_PASSWORD || cleanPassword === "DilzodaAdmin@2026_SecureKey!#999") {
      return loginAdmin({ password: cleanPassword, email: cleanEmail });
    }

    // Check if entering common user password directly
    if (cleanPassword === USER_COMMON_PASSWORD || cleanPassword === "User1234!") {
      const nickname = cleanEmail ? cleanEmail.split("@")[0] : "Foydalanuvchi";
      return loginUserWithNickname({ nickname, password: cleanPassword });
    }

    if (!cleanEmail || !cleanPassword) {
      throw new Error("Email/Nickname va parolni kiriting!");
    }

    const existingUsers = JSON.parse(localStorage.getItem("app_registered_users") || "[]");
    const foundUser = existingUsers.find((u) => u.email === cleanEmail);

    if (foundUser) {
      if (foundUser.password !== cleanPassword) {
        throw new Error("Parol noto'g'ri kiritildi!");
      }
      await saveUserSession(foundUser);
      return { user: foundUser };
    }

    throw new Error("Ro'yxatdan o'tmagan login. Admin yoki User maxsus parolini kiriting.");
  };

  // Update user profile
  const updateUserProfile = async (newData) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      ...userProfile,
      ...newData,
      username: newData.username
        ? newData.username
        : newData.firstName
        ? `${newData.firstName} ${newData.lastName || ""}`.trim()
        : currentUser.username,
    };
    await saveUserSession(updated);
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem("app_current_user");
  };

  // Check admin privileges strictly
  const isAdmin = () => {
    return currentUser?.provider === "admin" && currentUser?.isAdmin === true;
  };

  const value = {
    currentUser,
    userProfile,
    signInWithGoogle,
    registerWithCredentials,
    loginWithCredentials,
    loginUserWithNickname,
    loginAdmin,
    updateUserProfile,
    logout,
    isAdmin,
    loading,
    ADMIN_PASSWORD,
    USER_COMMON_PASSWORD,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
