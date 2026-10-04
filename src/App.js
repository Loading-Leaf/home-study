import { auth, onAuthStateChanged } from "./firebase.js";
import { subscribeUserProfile, subscribeStudyLogs, createUserProfile } from "./services/studyService.js";
import { renderAuthModal } from "./components/AuthModal.js";
import { renderDashboard } from "./components/Dashboard.js";

export function initApp(rootElement) {
  let currentUser = null;
  let userProfile = null;
  let studyLogs = [];
  let unsubProfile = null;
  let unsubLogs = null;
  let loadingAuth = true;

  function render() {
    if (loadingAuth) {
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; animation: pulse 1.5s infinite;">📚</div>
          <p style="font-family: var(--font-heading); font-size: 1.1rem;">自宅学習インサイトを読み込み中...</p>
        </div>
      `;
      return;
    }

    if (!currentUser) {
      // Clean up Firestore listeners
      if (unsubProfile) unsubProfile();
      if (unsubLogs) unsubLogs();
      renderAuthModal(rootElement, (user) => {
        currentUser = user;
        setupListeners();
      });
      return;
    }

    if (!userProfile) {
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; animation: pulse 1.5s infinite;">⏳</div>
          <p>ユーザープロフィールを同期中...</p>
        </div>
      `;
      return;
    }

    renderDashboard(rootElement, userProfile, studyLogs);
  }

  function setupListeners() {
    if (!currentUser) return;

    if (unsubProfile) unsubProfile();
    if (unsubLogs) unsubLogs();

    unsubProfile = subscribeUserProfile(currentUser.uid, async (profile) => {
      if (!profile) {
        // Fallback profile creation if absent
        userProfile = await createUserProfile(currentUser.uid, {
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email.split('@')[0]
        });
      } else {
        userProfile = profile;
      }
      render();
    });

    unsubLogs = subscribeStudyLogs(currentUser.uid, (logs) => {
      studyLogs = logs;
      render();
    });
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    loadingAuth = false;
    if (user) {
      setupListeners();
    } else {
      userProfile = null;
      studyLogs = [];
      render();
    }
  });

  // Initial call
  render();
}
