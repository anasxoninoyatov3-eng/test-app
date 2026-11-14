import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { FiAlertTriangle, FiUnlock, FiTrash2 } from "react-icons/fi";

const formatDuration = (ms) => {
  if (!ms) return "0:00";
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
};

// Tab yorlig'idagi qizil belgi uchun: hali ko'rib chiqilmagan hisobotlar soni
export const useActiveCheatingCount = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "cheatingReports"),
      (snap) => setCount(snap.docs.filter((d) => !d.data().unlocked).length),
      () => {}
    );
    return () => unsub();
  }, []);
  return count;
};

const CheatingReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "cheatingReports"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setReports(list);
        setLoading(false);
      },
      (err) => {
        console.error("Hisobotlarni o'qishda xatolik:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleUnlock = async (id) => {
    if (!window.confirm("O'quvchiga testni qayta ishlash uchun ruxsat berilsinmi?")) return;
    try {
      await updateDoc(doc(db, "cheatingReports", id), { unlocked: true });
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu hisobotni o'chirishni xohlaysizmi? (O'quvchi blokdan chiqadi)")) return;
    try {
      await deleteDoc(doc(db, "cheatingReports", id));
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  return (
    <div className="admin-card">
      <div className="card-header">
        <div className="header-icon">
          <FiAlertTriangle />
        </div>
        <h2>Firibgarlik hisobotlari</h2>
        <p>Test paytida to'liq ekrandan chiqqan yoki boshqa oynaga o'tgan o'quvchilar</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", opacity: 0.7, padding: "2rem" }}>Yuklanmoqda...</p>
      ) : reports.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.7, padding: "2rem" }}>
          Hozircha firibgarlik holatlari yo'q
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.2rem",
            marginTop: "1.5rem",
          }}
        >
          {reports.map((r) => (
            <div
              key={r.id}
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: `1px solid ${r.unlocked ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                borderRadius: 18,
                padding: "1.3rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{r.studentName}</h3>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    height: "fit-content",
                    background: r.unlocked ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                    color: r.unlocked ? "#10b981" : "#ef4444",
                  }}
                >
                  {r.unlocked ? "Ruxsat berilgan" : "Bloklangan"}
                </span>
              </div>
              {r.studentEmail && (
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{r.studentEmail}</span>
              )}

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  fontSize: "0.9rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Row label="Test (mavzu)" value={r.topicName} />
                <Row label="Sabab" value={r.reason} />
                <Row
                  label="Yechgan savollari"
                  value={`${r.solvedCount} / ${r.totalQuestions} (to'g'ri: ${r.correctCount})`}
                />
                <Row label="Hozirgi savol" value={`#${r.currentQuestionNumber}`} />
                <Row label="Sarflangan vaqt" value={formatDuration(r.timeSpentMs)} />
                <Row label="Aniqlangan vaqt" value={r.createdDateStr} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {!r.unlocked && (
                  <button
                    type="button"
                    onClick={() => handleUnlock(r.id)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <FiUnlock /> Ruxsat berish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
    <span style={{ opacity: 0.7 }}>{label}:</span>
    <strong style={{ textAlign: "right" }}>{value}</strong>
  </div>
);

export default CheatingReports;
