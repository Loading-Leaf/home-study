import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * Helper to format date string YYYY-MM-DD
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start date of the current week (Monday) YYYY-MM-DD
 */
export function getStartOfWeekString() {
  const d = new Date();
  const day = d.getDay(); // 0 is Sun, 1 is Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dateVal = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateVal}`;
}

/**
 * Create or initialize User Document in Firestore
 */
export async function createUserProfile(uid, profileData) {
  const userRef = doc(db, "users", uid);
  const defaultProfile = {
    uid,
    name: profileData.name || "学習者",
    email: profileData.email || "",
    birthdate: profileData.birthdate || "2000-01-01",
    affiliation: profileData.affiliation || "一般",
    targetGoal: profileData.targetGoal || "スキルアップ",
    targetStudyHours: Math.min(Math.max(Number(profileData.targetStudyHours) || 10, 3), 15), // 3~15h
    studyStatus: "学習スタート!",
    totalHours: 0,
    weeklyHours: 0,
    dailyHours: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(userRef, defaultProfile, { merge: true });
  return defaultProfile;
}

/**
 * Get User Profile
 */
export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Listen to real-time User Profile changes
 */
export function subscribeUserProfile(uid, callback) {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("Firestore user profile subscription error:", err);
  });
}

/**
 * Update User Profile (Goal, Target Hours, Affiliation, etc.)
 */
export async function updateUserProfile(uid, updates) {
  const userRef = doc(db, "users", uid);
  if (updates.targetStudyHours !== undefined) {
    updates.targetStudyHours = Math.min(Math.max(Number(updates.targetStudyHours), 3), 15);
  }
  updates.updatedAt = serverTimestamp();
  await updateDoc(userRef, updates);
}

/**
 * Add a Study Log Record & Recalculate Metrics
 */
export async function addStudyLog(uid, logData) {
  const logsRef = collection(db, "users", uid, "logs");
  const newLog = {
    date: logData.date || getTodayString(),
    durationMinutes: Number(logData.durationMinutes) || 0,
    subject: logData.subject || "自主学習",
    notes: logData.notes || "",
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(logsRef, newLog);
  await recalculateUserStudyMetrics(uid);
  return docRef.id;
}

/**
 * Delete a Study Log Record
 */
export async function deleteStudyLog(uid, logId) {
  const logRef = doc(db, "users", uid, "logs", logId);
  await deleteDoc(logRef);
  await recalculateUserStudyMetrics(uid);
}

/**
 * Subscribe to Study Logs for a User
 */
export function subscribeStudyLogs(uid, callback) {
  const logsRef = collection(db, "users", uid, "logs");
  const q = query(logsRef, orderBy("date", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(logs);
  }, (err) => {
    console.error("Firestore study logs subscription error:", err);
  });
}

/**
 * Recalculate Total, Weekly, Daily Study Hours and update Profile & Status
 */
export async function recalculateUserStudyMetrics(uid) {
  const logsRef = collection(db, "users", uid, "logs");
  const snapshot = await getDocs(logsRef);
  
  const todayStr = getTodayString();
  const startOfWeekStr = getStartOfWeekString();
  
  let totalMinutes = 0;
  let weeklyMinutes = 0;
  let dailyMinutes = 0;
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const duration = Number(data.durationMinutes) || 0;
    totalMinutes += duration;
    
    if (data.date >= startOfWeekStr) {
      weeklyMinutes += duration;
    }
    if (data.date === todayStr) {
      dailyMinutes += duration;
    }
  });
  
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;
  const dailyHours = Math.round((dailyMinutes / 60) * 10) / 10;
  
  // Determine Study Status based on weekly progress vs target
  const profile = await getUserProfile(uid);
  const target = profile ? (profile.targetStudyHours || 10) : 10;
  
  let studyStatus = "順調";
  const progressRatio = weeklyHours / target;
  if (progressRatio >= 1.0) {
    studyStatus = "🎉 今週の目標達成!";
  } else if (progressRatio >= 0.7) {
    studyStatus = "🔥 好調! あと少し";
  } else if (progressRatio >= 0.3) {
    studyStatus = "📖 順調に進行中";
  } else {
    studyStatus = "⚡ ペースアップ推奨";
  }
  
  await updateUserProfile(uid, {
    totalHours,
    weeklyHours,
    dailyHours,
    studyStatus
  });
}
