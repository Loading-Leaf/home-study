export function renderWeeklyReportModal(container, profile, studyLogs, onClose) {
  let sending = false;
  let sentStatus = "";

  function update() {
    const weeklyHours = profile.weeklyHours || 0;
    const targetHours = profile.targetStudyHours || 10;
    const percent = Math.min(Math.round((weeklyHours / targetHours) * 100), 100);

    // Subject breakdown calculation
    const subjectMap = {};
    studyLogs.forEach(log => {
      subjectMap[log.subject] = (subjectMap[log.subject] || 0) + (log.durationMinutes || 0);
    });

    const subjectItemsHtml = Object.entries(subjectMap).length > 0
      ? Object.entries(subjectMap).map(([subj, mins]) => `
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding: 0.4rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
            <span>${subj}</span>
            <span style="font-weight: 600; color: var(--accent-cyan);">${Math.round(mins/60 * 10)/10} 時間 (${mins}分)</span>
          </div>
        `).join('')
      : '<p style="color: var(--text-muted); font-size: 0.85rem;">今週の記録はまだありません。</p>';

    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 600px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.3rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
              <span>📩</span> 1週間学習レポート & メール配信設定
            </h3>
            <button id="close-report-btn" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">&times;</button>
          </div>

          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: #a5b4fc; font-weight: 600;">
              <span>🕒</span> 毎週定期メール送信設定
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">
              登録アドレス (<strong>${profile.email}</strong>) 宛に、<strong>日本時間毎週日曜日 18:00 JST</strong> に自動でレポートが配信されます。
            </p>
          </div>

          ${sentStatus ? `<div class="alert alert-success" style="margin-bottom: 1rem;">✅ ${sentStatus}</div>` : ''}

          <div style="background: #0f172a; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; font-family: var(--font-body);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <span style="font-weight: 700; color: var(--primary);">【自宅学習レポート - JST 週間まとめ】</span>
              <span class="badge badge-purple">日曜日 18:00 定期発行</span>
            </div>

            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);">
              <p>宛先: <strong>${profile.name} 様</strong> (${profile.affiliation})</p>
              <p style="margin-top: 0.5rem;">今週の学習目標「<strong>${profile.targetGoal}</strong>」への達成状況です。</p>

              <div style="background: rgba(255, 255, 255, 0.04); border-radius: var(--radius-sm); padding: 1rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem; font-weight: 600;">
                  <span>目標 ${targetHours} 時間 / 今週の実績: ${weeklyHours} 時間</span>
                  <span style="color: var(--accent-emerald);">${percent}% 達成</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
              </div>

              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--accent-purple);">■ 科目別学習の内訳</h4>
              <div style="margin-bottom: 1rem;">
                ${subjectItemsHtml}
              </div>

              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--accent-amber);">■ 学習ステータス</h4>
              <p style="font-size: 0.88rem; color: var(--text-muted);">${profile.studyStatus}</p>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-dim);">※ Cloud Functions / SendGrid と連携可能</span>
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" id="close-report-bottom-btn" class="btn btn-secondary">閉じる</button>
              <button type="button" id="trigger-send-email-btn" class="btn btn-primary" ${sending ? 'disabled' : ''}>
                ${sending ? '送信テスト中...' : 'メール即時送信テスト'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#close-report-btn').addEventListener('click', onClose);
    container.querySelector('#close-report-bottom-btn').addEventListener('click', onClose);

    container.querySelector('#trigger-send-email-btn').addEventListener('click', () => {
      sending = true;
      sentStatus = "";
      update();

      setTimeout(() => {
        sending = false;
        sentStatus = `${profile.email} 宛に今週の学習レポートメール送信リクエストを送付しました！ (日本時間日曜18:00スケジュール有効)`;
        update();
      }, 1200);
    });
  }

  update();
}
