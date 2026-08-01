import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

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
      // 1. Check if Google GIS script is available
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

              const isUserAdmin =
                googleData.email === "microsoftreact@gmail.com" ||
                googleData.email === "anasxoninoyatov3@gmail.com";

              const profile = {
                uid: googleData.sub || `google_${Date.now()}`,
                email: googleData.email,
                username: googleData.name || googleData.email.split("@")[0],
                firstName: googleData.given_name || googleData.name?.split(" ")[0] || "",
                lastName: googleData.family_name || googleData.name?.split(" ").slice(1).join(" ") || "",
                avatar: googleData.picture || "",
                createdAt: new Date().toISOString(),
                isAdmin: isUserAdmin,
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
        // Fallback: Custom OAuth 2.0 / Quick Google Login selector prompt
        const promptEmail = prompt(
          "Google OAuth 2.0 - Google email manzilingizni kiriting:",
          "microsoftreact@gmail.com"
        );

        if (!promptEmail) {
          reject(new Error("Google orqali kirish bekor qilindi."));
          return;
        }

        const isUserAdmin =
          promptEmail.trim().toLowerCase() === "microsoftreact@gmail.com" ||
          promptEmail.trim().toLowerCase() === "anasxoninoyatov3@gmail.com";

        const profile = {
          uid: `google_${Date.now()}`,
          email: promptEmail.trim().toLowerCase(),
          username: promptEmail.split("@")[0],
          firstName: promptEmail.split("@")[0],
          lastName: "",
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${promptEmail}`,
          createdAt: new Date().toISOString(),
          isAdmin: isUserAdmin,
          provider: "google",
        };

        saveUserSession(profile);
        resolve({ user: profile });
      }
    });
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

    // Check existing registered users
    const existingUsers = JSON.parse(localStorage.getItem("app_registered_users") || "[]");
    const userExists = existingUsers.some((u) => u.email === cleanEmail);

    if (userExists) {
      throw new Error("Bu email manzili allaqachon ro'yxatdan o'tgan!");
    }

    const isUserAdmin =
      cleanEmail === "microsoftreact@gmail.com" ||
      cleanEmail === "anasxoninoyatov3@gmail.com";

    const newProfile = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      username: cleanName,
      firstName: cleanName.split(" ")[0] || cleanName,
      lastName: cleanName.split(" ").slice(1).join(" ") || "",
      password: password, // local auth check
      createdAt: new Date().toISOString(),
      isAdmin: isUserAdmin,
      provider: "email",
    };

    existingUsers.push(newProfile);
    localStorage.setItem("app_registered_users", JSON.stringify(existingUsers));

    await saveUserSession(newProfile);
    return { user: newProfile };
  };

  // Sign in with Input credentials (Email, Password)
  const loginWithCredentials = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error("Email va parolni kiriting!");
    }

    const existingUsers = JSON.parse(localStorage.getItem("app_registered_users") || "[]");
    const foundUser = existingUsers.find((u) => u.email === cleanEmail);

    // Admin direct override check
    const isUserAdmin =
      cleanEmail === "microsoftreact@gmail.com" ||
      cleanEmail === "anasxoninoyatov3@gmail.com";

    if (foundUser) {
      if (foundUser.password !== password) {
        throw new Error("Parol noto'g'ri kiritildi!");
      }
      await saveUserSession(foundUser);
      return { user: foundUser };
    }

    // Default admin account shortcut if not registered yet
    if (isUserAdmin) {
      const adminProfile = {
        uid: `admin_${Date.now()}`,
        email: cleanEmail,
        username: "Admin",
        firstName: "Admin",
        lastName: "",
        createdAt: new Date().toISOString(),
        isAdmin: true,
        provider: "email",
      };
      await saveUserSession(adminProfile);
      return { user: adminProfile };
    }

    throw new Error("Bunday email ro'yxatdan o'tmagan. Avval ro'yxatdan o'ting.");
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

  // Check admin privileges (all authenticated users can manage/create tests)
  const isAdmin = () => {
    return !!currentUser;
  };

  const value = {
    currentUser,
    userProfile,
    signInWithGoogle,
    registerWithCredentials,
    loginWithCredentials,
    updateUserProfile,
    logout,
    isAdmin,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
