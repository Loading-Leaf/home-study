import { addStudyLog, getTodayString } from "../services/studyService.js";

export function renderStudyLogModal(container, userUid, onClose) {
  let loading = false;
  let errorMsg = "";

  // Preserved input values
  let dateVal = getTodayString();
  let subjectVal = "プログラミング";
  let durationVal = 60;
  let notesVal = "";

  function update() {
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.3rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
              <span>📝</span> 学習記録の追加
            </h3>
            <button id="close-log-btn" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">&times;</button>
          </div>

          ${errorMsg ? `<div class="alert alert-danger" style="margin-bottom: 1rem;">⚠️ ${errorMsg}</div>` : ''}

          <form id="study-log-form">
            <div class="form-group">
              <label class="form-label">日付</label>
              <input type="date" id="log-date" class="form-input" value="${dateVal}" required />
            </div>

            <div class="form-group">
              <label class="form-label">学習科目 / テーマ <span style="color: var(--accent-rose);">*</span></label>
              <select id="log-subject" class="form-select" required>
                <option value="プログラミング" ${subjectVal === 'プログラミング' ? 'selected' : ''}>💻 プログラミング</option>
                <option value="英語 / 語学" ${subjectVal === '英語 / 語学' ? 'selected' : ''}>🇬🇧 英語 / 語学</option>
                <option value="資格試験勉強" ${subjectVal === '資格試験勉強' ? 'selected' : ''}>📜 資格試験勉強</option>
                <option value="数学 / 理数系" ${subjectVal === '数学 / 理数系' ? 'selected' : ''}>📐 数学 / 理数系</option>
                <option value="読書 / インプット" ${subjectVal === '読書 / インプット' ? 'selected' : ''}>📖 読書 / インプット</option>
                <option value="その他" ${subjectVal === 'その他' ? 'selected' : ''}>💡 その他</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">学習時間 (分) <span style="color: var(--accent-rose);">*</span></label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="number" id="log-duration" class="form-input" placeholder="例: 60" min="5" max="720" value="${durationVal}" required />
                <span style="color: var(--text-muted); font-size: 0.9rem; white-space: nowrap;">分</span>
              </div>
              <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-min="30">30分</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-min="60">60分</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-min="90">90分</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-min="120">120分</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">メモ / 振り返り (自由記述)</label>
              <textarea id="log-notes" class="form-textarea" placeholder="例: 今日の成果、難しかった点、次回やりたいことなど">${notesVal}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button type="button" id="cancel-log-btn" class="btn btn-secondary">キャンセル</button>
              <button type="submit" class="btn btn-primary" ${loading ? 'disabled' : ''}>
                ${loading ? '保存中...' : '記録を保存する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Presets listeners
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        durationVal = Number(btn.dataset.min);
        const durationInput = container.querySelector('#log-duration');
        if (durationInput) durationInput.value = durationVal;
      });
    });

    // Close handlers
    container.querySelector('#close-log-btn').addEventListener('click', onClose);
    container.querySelector('#cancel-log-btn').addEventListener('click', onClose);

    // Form submit
    container.querySelector('#study-log-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Extract input values BEFORE calling update()
      dateVal = container.querySelector('#log-date').value;
      subjectVal = container.querySelector('#log-subject').value;
      durationVal = Number(container.querySelector('#log-duration').value);
      notesVal = container.querySelector('#log-notes').value.trim();

      loading = true;
      errorMsg = "";
      update();

      try {
        await addStudyLog(userUid, {
          date: dateVal,
          subject: subjectVal,
          durationMinutes: durationVal,
          notes: notesVal
        });
        onClose();
      } catch (err) {
        console.error("Error saving log:", err);
        loading = false;
        errorMsg = "ログの保存に失敗しました。もう一度お試しください。";
        update();
      }
    });
  }

  update();
}
