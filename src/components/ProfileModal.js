import { updateUserProfile, recalculateUserStudyMetrics } from "../services/studyService.js";

export function renderProfileModal(container, profile, onClose) {
  let loading = false;
  let errorMsg = "";
  let successMsg = "";

  // Preserved input values
  let nameVal = profile.name || '';
  let birthdateVal = profile.birthdate || '2000-01-01';
  let affiliationVal = profile.affiliation || '';
  let goalVal = profile.targetGoal || '';
  let targetStudyHoursVal = profile.targetStudyHours || 10;

  function update() {
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.3rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
              <span>👤</span> ユーザープロフィールの編集
            </h3>
            <button id="close-profile-btn" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">&times;</button>
          </div>

          ${errorMsg ? `<div class="alert alert-danger" style="margin-bottom: 1rem;">⚠️ ${errorMsg}</div>` : ''}
          ${successMsg ? `<div class="alert alert-success" style="margin-bottom: 1rem;">✅ ${successMsg}</div>` : ''}

          <form id="profile-form">
            <div class="form-group">
              <label class="form-label">メールアドレス (読み取り専用)</label>
              <input type="email" class="form-input" value="${profile.email || ''}" disabled style="opacity: 0.7;" />
            </div>

            <div class="form-group">
              <label class="form-label">お名前 <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="prof-name" class="form-input" value="${nameVal}" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">生年月日</label>
                <input type="date" id="prof-birthdate" class="form-input" value="${birthdateVal}" />
              </div>
              <div class="form-group">
                <label class="form-label">所属 (自由記述)</label>
                <input type="text" id="prof-affiliation" class="form-input" value="${affiliationVal}" placeholder="例: 大学生, 社会人" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">現在の目標 <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="prof-goal" class="form-input" value="${goalVal}" placeholder="例: 基本情報技術者試験合格" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="display: flex; justify-content: space-between;">
                <span>週間目標学習時間 (3〜15時間)</span>
                <span id="prof-hours-val" style="color: var(--primary); font-weight: 700;">${targetStudyHoursVal} 時間/週</span>
              </label>
              <input type="range" id="prof-target-hours" min="3" max="15" value="${targetStudyHoursVal}" step="1" style="accent-color: var(--primary); width: 100%; cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button type="button" id="cancel-profile-btn" class="btn btn-secondary">キャンセル</button>
              <button type="submit" class="btn btn-primary" ${loading ? 'disabled' : ''}>
                ${loading ? '更新中...' : '変更を保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const rangeInput = container.querySelector('#prof-target-hours');
    const rangeValLabel = container.querySelector('#prof-hours-val');
    if (rangeInput && rangeValLabel) {
      rangeInput.addEventListener('input', (e) => {
        targetStudyHoursVal = Number(e.target.value);
        rangeValLabel.textContent = `${targetStudyHoursVal} 時間/週`;
      });
    }

    container.querySelector('#close-profile-btn').addEventListener('click', onClose);
    container.querySelector('#cancel-profile-btn').addEventListener('click', onClose);

    container.querySelector('#profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Extract values BEFORE calling update()
      nameVal = container.querySelector('#prof-name').value.trim();
      birthdateVal = container.querySelector('#prof-birthdate').value;
      affiliationVal = container.querySelector('#prof-affiliation').value.trim();
      goalVal = container.querySelector('#prof-goal').value.trim();
      targetStudyHoursVal = Number(container.querySelector('#prof-target-hours').value);

      loading = true;
      errorMsg = "";
      successMsg = "";
      update();

      try {
        await updateUserProfile(profile.uid, {
          name: nameVal,
          birthdate: birthdateVal,
          affiliation: affiliationVal,
          targetGoal: goalVal,
          targetStudyHours: targetStudyHoursVal
        });
        await recalculateUserStudyMetrics(profile.uid);
        
        successMsg = "プロフィールを更新しました！";
        loading = false;
        update();
        setTimeout(onClose, 800);
      } catch (err) {
        console.error("Error updating profile:", err);
        loading = false;
        errorMsg = `プロフィールの更新に失敗しました: ${err.message}`;
        update();
      }
    });
  }

  update();
}
