import { signOutUser } from "../firebase.js";
import { renderStudyLogModal } from "./StudyLogModal.js";
import { renderProfileModal } from "./ProfileModal.js";
import { renderWeeklyReportModal } from "./WeeklyReportModal.js";
import { generateGeminiStudyInsight } from "../services/geminiService.js";
import { deleteStudyLog } from "../services/studyService.js";

export function renderDashboard(container, profile, studyLogs) {
  let aiInsightText = "";
  let generatingAi = false;
  let customApiKey = localStorage.getItem("custom_gemini_api_key") || "";

  function update() {
    const weeklyHours = profile.weeklyHours || 0;
    const targetHours = profile.targetStudyHours || 10;
    const progressPercent = Math.min(Math.round((weeklyHours / targetHours) * 100), 100);

    // Subject breakdown
    const subjectMap = {};
    studyLogs.forEach(log => {
      subjectMap[log.subject] = (subjectMap[log.subject] || 0) + (log.durationMinutes || 0);
    });

    const recentLogsHtml = studyLogs.length > 0 
      ? studyLogs.map(log => `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: flex-start; transition: border-color 0.2s;" class="log-item-card">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="badge badge-indigo">${log.subject}</span>
                <span style="font-size: 0.8rem; color: var(--text-dim);">${log.date}</span>
              </div>
              <p style="font-size: 0.92rem; color: var(--text-main); margin-top: 0.25rem; font-weight: 500;">
                ${log.notes ? log.notes : '<em style="color: var(--text-dim);">メモなし</em>'}
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-family: var(--font-heading); font-weight: 700; color: var(--accent-cyan); font-size: 1.05rem;">
                ${log.durationMinutes} 分
              </span>
              <button class="btn btn-danger btn-sm delete-log-btn" data-id="${log.id}" title="削除">
                🗑️
              </button>
            </div>
          </div>
        `).join('')
      : `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
          <p>まだ学習記録がありません。</p>
          <p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 0.25rem;">「＋ 学習記録を追加」ボタンから最初の勉強時間を記録しましょう！</p>
        </div>
      `;

    // Status badge style
    let statusClass = "badge-indigo";
    if (profile.studyStatus?.includes("達成")) statusClass = "badge-emerald";
    else if (profile.studyStatus?.includes("好調")) statusClass = "badge-purple";
    else if (profile.studyStatus?.includes("ペースアップ")) statusClass = "badge-amber";

    container.innerHTML = `
      <!-- Navigation Bar -->
      <nav class="navbar">
        <div class="brand-logo">
          <span>📚 自宅学習インサイト</span>
        </div>
        <div class="user-nav-profile">
          <div style="text-align: right; display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 0.95rem;">${profile.name} 様</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${profile.affiliation || '一般'}</span>
          </div>
          <button id="open-weekly-report-btn" class="btn btn-secondary btn-sm" title="1週間学習レポート (日曜18:00)">
            📩 週間レポート
          </button>
          <button id="open-profile-btn" class="btn btn-secondary btn-sm" title="プロフィール編集">
            👤 設定
          </button>
          <button id="logout-btn" class="btn btn-outline btn-sm" style="color: var(--accent-rose); border-color: rgba(244,63,94,0.4);">
            ログアウト
          </button>
        </div>
      </nav>

      <!-- Main Dashboard Container -->
      <div class="dashboard-container">
        
        <!-- Metrics Overview Grid -->
        <div class="metrics-grid">
          <!-- Today's Hours -->
          <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">本日の学習時間</span>
              <span style="font-size: 1.2rem;">⏱️</span>
            </div>
            <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-main);">
              ${profile.dailyHours || 0} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">時間</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 0.25rem;">
              今日もしっかり継続しましょう！
            </div>
          </div>

          <!-- Weekly Hours & Target -->
          <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">今週の学習進捗 (目標 ${targetHours}h)</span>
              <span style="font-size: 1.2rem;">🎯</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
              <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--primary);">
                ${weeklyHours} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ ${targetHours}時間</span>
              </div>
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-emerald);">${progressPercent}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <!-- Total Cumulative Hours -->
          <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">累計学習時間</span>
              <span style="font-size: 1.2rem;">🔥</span>
            </div>
            <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--accent-purple);">
              ${profile.totalHours || 0} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">時間</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 0.25rem;">
              努力の積み重ねが形になっています
            </div>
          </div>

          <!-- Target Goal & Status -->
          <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">現在の目標</span>
              <span class="badge ${statusClass}">${profile.studyStatus || '進行中'}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0.4rem 0; word-break: break-word;">
              ${profile.targetGoal || 'スキルアップ'}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              生年月日: ${profile.birthdate || '未設定'}
            </div>
          </div>
        </div>

        <!-- Action Toolbar -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; background: var(--bg-card); padding: 1rem 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button id="add-log-btn" class="btn btn-primary">
              <span>＋</span> 学習記録を追加
            </button>
            <button id="generate-ai-btn" class="btn btn-secondary" style="background: linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(6,182,212,0.2) 100%); border-color: rgba(168,85,247,0.4);" ${generatingAi ? 'disabled' : ''}>
              <span>✨</span> ${generatingAi ? 'Gemini分析中...' : 'Gemini AI 学習評価・インサイト生成'}
            </button>
          </div>

          <button id="api-key-config-btn" class="btn btn-outline btn-sm" style="font-size: 0.8rem;">
            ⚙️ Gemini APIキー設定 (${customApiKey ? '設定済み' : '自動評価'})
          </button>
        </div>

        <!-- Content Grid: Left (Gemini Insight & Logs), Right (Breakdown & Weekly Schedule) -->
        <div class="content-grid">
          <!-- Main Column -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Gemini AI Insight Box -->
            ${aiInsightText ? `
              <div class="glass-card" style="border-color: rgba(168, 85, 247, 0.4); background: linear-gradient(180deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                  <h3 style="font-size: 1.15rem; color: var(--accent-purple); display: flex; align-items: center; gap: 0.5rem;">
                    <span>✨</span> Gemini AI による学習評価＆アドバイス
                  </h3>
                  <button id="re-generate-ai-btn" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;">
                    🔄 再生成
                  </button>
                </div>
                <div style="font-size: 0.92rem; line-height: 1.7; color: var(--text-main); white-space: pre-line;">
                  ${aiInsightText}
                </div>
              </div>
            ` : ''}

            <!-- Recent Logs List -->
            <div class="glass-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="font-size: 1.15rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                  <span>📋</span> 学習記録ログ (${studyLogs.length}件)
                </h3>
              </div>
              ${recentLogsHtml}
            </div>
          </div>

          <!-- Sidebar Column -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Subject Breakdown Chart / List -->
            <div class="glass-card">
              <h3 style="font-size: 1.05rem; color: var(--text-main); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>📊</span> 科目別学習時間の割合
              </h3>
              ${Object.keys(subjectMap).length > 0 ? Object.entries(subjectMap).map(([subj, mins]) => {
                const totalMins = studyLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) || 1;
                const ratio = Math.round((mins / totalMins) * 100);
                return `
                  <div style="margin-bottom: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span style="font-weight: 500;">${subj}</span>
                      <span style="color: var(--text-muted);">${Math.round(mins/60*10)/10}時間 (${ratio}%)</span>
                    </div>
                    <div class="progress-bar-bg" style="height: 6px;">
                      <div class="progress-bar-fill" style="width: ${ratio}%; background: var(--gradient-emerald);"></div>
                    </div>
                  </div>
                `;
              }).join('') : '<p style="font-size: 0.85rem; color: var(--text-muted);">まだデータがありません。</p>'}
            </div>

            <!-- Sunday 18:00 Weekly Email Info Card -->
            <div class="glass-card" style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);">
              <h3 style="font-size: 1.05rem; color: var(--accent-cyan); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>⏰</span> 毎週レポート配信機能
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
                日本時間 <strong>毎週日曜日 18:00 JST</strong> に、ご登録メールアドレス (<code>${profile.email}</code>) 宛てに1週間の総総括レポートが送信される設定になっています。
              </p>
              <button id="sidebar-weekly-report-btn" class="btn btn-secondary btn-sm btn-full" style="margin-top: 1rem;">
                📩 今週のプレビュー表示
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Container -->
      <div id="dashboard-modal-container"></div>
    `;

    const modalContainer = container.querySelector('#dashboard-modal-container');

    // Event Listeners
    container.querySelector('#logout-btn').addEventListener('click', () => signOutUser());

    container.querySelector('#open-profile-btn').addEventListener('click', () => {
      renderProfileModal(modalContainer, profile, () => {
        modalContainer.innerHTML = "";
      });
    });

    const openReportHandler = () => {
      renderWeeklyReportModal(modalContainer, profile, studyLogs, () => {
        modalContainer.innerHTML = "";
      });
    };
    container.querySelector('#open-weekly-report-btn').addEventListener('click', openReportHandler);
    container.querySelector('#sidebar-weekly-report-btn').addEventListener('click', openReportHandler);

    container.querySelector('#add-log-btn').addEventListener('click', () => {
      renderStudyLogModal(modalContainer, profile.uid, () => {
        modalContainer.innerHTML = "";
      });
    });

    // Delete log buttons
    container.querySelectorAll('.delete-log-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const logId = btn.dataset.id;
        if (confirm("この学習記録を削除してもよろしいですか？")) {
          await deleteStudyLog(profile.uid, logId);
        }
      });
    });

    // Gemini AI button handler
    const runAiHandler = async () => {
      generatingAi = true;
      update();
      aiInsightText = await generateGeminiStudyInsight(profile, studyLogs, customApiKey);
      generatingAi = false;
      update();
    };

    container.querySelector('#generate-ai-btn')?.addEventListener('click', runAiHandler);
    container.querySelector('#re-generate-ai-btn')?.addEventListener('click', runAiHandler);

    // API Key config modal trigger
    container.querySelector('#api-key-config-btn').addEventListener('click', () => {
      const key = prompt("Gemini APIキーを入力してください (未設定の場合は内蔵AI評価エンジンが稼働します):", customApiKey);
      if (key !== null) {
        customApiKey = key.trim();
        localStorage.setItem("custom_gemini_api_key", customApiKey);
        update();
      }
    });
  }

  update();
}
