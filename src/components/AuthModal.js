import { signUpUser, signInUser, signInWithGoogle, resetPassword } from "../firebase.js";
import { createUserProfile, getUserProfile } from "../services/studyService.js";

export function renderAuthModal(container, onAuthSuccess) {
  let isSignUp = false;
  let errorMsg = "";
  let successMsg = "";
  let loading = false;

  // Form field state preservation
  let emailVal = "";
  let passwordVal = "";
  let nameVal = "";
  let birthdateVal = "2000-01-01";
  let affiliationVal = "";
  let goalVal = "";
  let targetHoursVal = 10;

  function update() {
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
            <h2 style="font-size: 1.6rem; color: var(--text-main);">
              ${isSignUp ? "新規アカウント登録" : "自宅学習インサイトへログイン"}
            </h2>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${isSignUp ? "目標設定とユーザー情報を入力して学習を開始しましょう" : "登録済みのメールアドレスとパスワードを入力してください"}
            </p>
          </div>

          ${errorMsg ? `<div class="alert alert-danger" style="margin-bottom: 1rem;">⚠️ ${errorMsg}</div>` : ''}
          ${successMsg ? `<div class="alert alert-success" style="margin-bottom: 1rem;">✅ ${successMsg}</div>` : ''}

          <!-- Google Sign-In Option -->
          <button type="button" id="google-auth-btn" class="btn btn-secondary btn-full btn-lg" style="margin-bottom: 1.25rem; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15);">
            <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 0.5rem;"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Google アカウントで${isSignUp ? '登録' : 'ログイン'}
          </button>

          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; color: var(--text-dim); font-size: 0.82rem;">
            <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
            <span>またはメールアドレスで</span>
            <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
          </div>

          <form id="auth-form">
            ${isSignUp ? `
              <div class="form-group">
                <label class="form-label">お名前 <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="auth-name" class="form-input" placeholder="例: 山田 太郎" value="${nameVal}" required />
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">メールアドレス <span style="color: var(--accent-rose);">*</span></label>
              <input type="email" id="auth-email" class="form-input" placeholder="example@email.com" value="${emailVal}" required />
            </div>

            <div class="form-group">
              <label class="form-label">パスワード <span style="color: var(--accent-rose);">*</span></label>
              <input type="password" id="auth-password" class="form-input" placeholder="6文字以上" minlength="6" value="${passwordVal}" required />
            </div>

            ${isSignUp ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">生年月日</label>
                  <input type="date" id="auth-birthdate" class="form-input" value="${birthdateVal}" />
                </div>
                <div class="form-group">
                  <label class="form-label">所属 (自由記述)</label>
                  <input type="text" id="auth-affiliation" class="form-input" value="${affiliationVal}" placeholder="例: 大学生, 社会人" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">現在の目標</label>
                <input type="text" id="auth-goal" class="form-input" value="${goalVal}" placeholder="例: TOEIC 800点取得, 基本情報合格" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="display: flex; justify-content: space-between;">
                  <span>週間目標学習時間 (3〜15時間)</span>
                  <span id="target-hours-val" style="color: var(--primary); font-weight: 700;">${targetHoursVal} 時間/週</span>
                </label>
                <input type="range" id="auth-target-hours" min="3" max="15" value="${targetHoursVal}" step="1" style="accent-color: var(--primary); width: 100%; cursor: pointer;" />
              </div>
            ` : ''}

            <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top: 0.5rem;" ${loading ? 'disabled' : ''}>
              ${loading ? '処理中...' : (isSignUp ? 'アカウントを作成して始める' : 'ログイン')}
            </button>
          </form>

          <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.88rem;">
            ${isSignUp ? `
              <span style="color: var(--text-muted);">すでにアカウントをお持ちですか？</span>
              <button id="toggle-mode-btn" style="background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; margin-left: 0.5rem;">
                ログインへ
              </button>
            ` : `
              <span style="color: var(--text-muted);">アカウントをお持ちでないですか？</span>
              <button id="toggle-mode-btn" style="background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; margin-left: 0.5rem;">
                新規登録はこちら
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // Range slider listener
    const rangeInput = container.querySelector('#auth-target-hours');
    const rangeValLabel = container.querySelector('#target-hours-val');
    if (rangeInput && rangeValLabel) {
      rangeInput.addEventListener('input', (e) => {
        targetHoursVal = Number(e.target.value);
        rangeValLabel.textContent = `${targetHoursVal} 時間/週`;
      });
    }

    // Toggle button listener
    container.querySelector('#toggle-mode-btn').addEventListener('click', () => {
      isSignUp = !isSignUp;
      errorMsg = "";
      successMsg = "";
      update();
    });

    // Google Auth listener
    container.querySelector('#google-auth-btn').addEventListener('click', async () => {
      errorMsg = "";
      try {
        const user = await signInWithGoogle();
        // Check if profile exists, create if not
        const existingProfile = await getUserProfile(user.uid);
        if (!existingProfile) {
          await createUserProfile(user.uid, {
            name: user.displayName || "Googleユーザー",
            email: user.email,
            birthdate: "2000-01-01",
            affiliation: "一般",
            targetGoal: "スキルアップ",
            targetStudyHours: 10
          });
        }
        onAuthSuccess(user);
      } catch (err) {
        console.error("Google Auth error:", err);
        if (err.code === 'auth/popup-closed-by-user') {
          errorMsg = "Google ログインがキャンセルされました。";
        } else if (err.code === 'auth/unauthorized-domain') {
          errorMsg = "このドメイン(localhost)は Firebase Console の Authorized domains に未登録です。";
        } else {
          errorMsg = `Googleログインエラー: ${err.message}`;
        }
        update();
      }
    });

    // Email Form submit listener
    container.querySelector('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg = "";
      successMsg = "";

      // Extract values BEFORE calling update()
      emailVal = container.querySelector('#auth-email').value.trim();
      passwordVal = container.querySelector('#auth-password').value;

      if (isSignUp) {
        nameVal = container.querySelector('#auth-name').value.trim();
        birthdateVal = container.querySelector('#auth-birthdate').value;
        affiliationVal = container.querySelector('#auth-affiliation').value.trim();
        goalVal = container.querySelector('#auth-goal').value.trim();
        targetHoursVal = Number(container.querySelector('#auth-target-hours').value) || 10;
      }

      if (!emailVal || !emailVal.includes('@')) {
        errorMsg = "正しいメールアドレスを入力してください (例: user@example.com)";
        update();
        return;
      }

      loading = true;
      update();

      try {
        if (isSignUp) {
          const user = await signUpUser(emailVal, passwordVal);
          await createUserProfile(user.uid, {
            name: nameVal || "学習者",
            email: emailVal,
            birthdate: birthdateVal || "2000-01-01",
            affiliation: affiliationVal || "一般",
            targetGoal: goalVal || "スキルアップ",
            targetStudyHours: targetHoursVal
          });
          onAuthSuccess(user);
        } else {
          const user = await signInUser(emailVal, passwordVal);
          onAuthSuccess(user);
        }
      } catch (err) {
        console.error("Auth error:", err);
        loading = false;
        if (err.code === 'auth/email-already-in-use') {
          errorMsg = "このメールアドレスはすでに登録されています。ログインをお試しください。";
        } else if (err.code === 'auth/invalid-email') {
          errorMsg = "メールアドレスの形式が正しくありません (例: user@example.com)。";
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          errorMsg = "メールアドレスまたはパスワードが正しくありません。";
        } else if (err.code === 'auth/weak-password') {
          errorMsg = "パスワードは6文字以上で設定してください。";
        } else {
          errorMsg = `認証エラー: ${err.message}`;
        }
        update();
      }
    });
  }

  update();
}
