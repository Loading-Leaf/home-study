/**
 * Gemini AI Insights & Study Evaluation Service
 * Analyzes study records, user targets, and weekly progress.
 */

export async function generateGeminiStudyInsight(userProfile, studyLogs, customApiKey = "") {
  // Use provided custom API key or default environment key, ensuring no leading/trailing whitespace
  const rawKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  
  const recentLogsText = studyLogs.slice(0, 10).map(log => 
    `- 日付: ${log.date}, 科目: ${log.subject}, 時間: ${log.durationMinutes}分, メモ: ${log.notes || 'なし'}`
  ).join("\n");

  const promptText = `
あなたは熱心で効率的なAI学習コーチ「Gemini Study Assistant」です。
以下の学習者情報と学習ログを分析し、**全体で300〜400文字程度に簡潔にまとめたアドバイス**を出力してください。長文にならず、要点を絞って端的に回答してください。

【受講者プロファイル】
・お名前: ${userProfile.name}
・所属: ${userProfile.affiliation}
・現在の目標: ${userProfile.targetGoal}
・週間目標学習時間: ${userProfile.targetStudyHours}時間
・現在の学習状況: ${userProfile.studyStatus}

【直近の学習実績】
・今週の学習時間: ${userProfile.weeklyHours}時間 / ${userProfile.targetStudyHours}時間 (達成率: ${Math.round((userProfile.weeklyHours / (userProfile.targetStudyHours || 1)) * 100)}%)
・累計学習時間: ${userProfile.totalHours}時間

【直近の学習ログ】
${recentLogsText || "まだ学習ログが記録されていません。"}

【出力フォーマット (各項目1〜2文で簡潔に記述)】
1. 🌟 **評価と称賛**: 達成率へのポジティブなフィードバック（1文）
2. 📊 **学習パターンの分析**: 科目バランスの短評（1〜2文）
3. 🎯 **アドバイス**: 効率化のワンポイントヒント（1文）
4. 🚀 **来週へのアクション**: 来週試すべき具体的な行動1つ（1文）
`;

  if (!apiKey) {
    // Generate an intelligent structured fallback if API key is not yet input
    return generateFallbackInsight(userProfile, studyLogs);
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`Gemini API call failed (${response.status} ${response.statusText}):`, errData);
      return generateFallbackInsight(userProfile, studyLogs);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return candidateText;
    }
    return generateFallbackInsight(userProfile, studyLogs);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return generateFallbackInsight(userProfile, studyLogs);
  }
}

/**
 * Smart heuristic rule-based AI feedback engine (Fallback when API key is unconfigured)
 */
function generateFallbackInsight(userProfile, studyLogs) {
  const weekly = userProfile.weeklyHours || 0;
  const target = userProfile.targetStudyHours || 10;
  const progressPercent = Math.min(Math.round((weekly / target) * 100), 100);
  const name = userProfile.name || "学習者";
  const goal = userProfile.targetGoal || "学習目標";

  // Calculate top subject
  const subjectMap = {};
  studyLogs.forEach(log => {
    subjectMap[log.subject] = (subjectMap[log.subject] || 0) + (log.durationMinutes || 0);
  });
  let topSubject = "自主学習";
  let maxMin = 0;
  Object.entries(subjectMap).forEach(([subj, min]) => {
    if (min > maxMin) {
      maxMin = min;
      topSubject = subj;
    }
  });

  return `🌟 **全体の評価と称賛**
${name}さん、お疲れ様です！目標「${goal}」に向けて、今週は **${weekly}時間** の学習を達成されています（目標 ${target}時間中 ${progressPercent}% 達成）。素晴らしい取り組み姿勢です！

📊 **学習パターンの分析**
・最も多く時間を割いている分野: **${topSubject}** (${Math.round(maxMin/60 * 10)/10}時間)
・累計学習時間: **${userProfile.totalHours || 0}時間**
継続的に学習を記録できており、知識が確実に定着し始めています。

🎯 **目標達成へのアドバイス**
週間 ${target}時間のペースを維持するためには、1日あたり約 ${Math.round((target / 7) * 10) / 10}時間 の学習時間を一定のスケジュール（例: 朝30分、夜1時間）に組み込むと、より無理なく継続できます。

🚀 **来週へのアクションプラン**
1. **隙間時間の活用**: 15分〜30分の短時間学習セッションをログに記録してみましょう。
2. **復習サイクルの導入**: 「${topSubject}」で学んだ内容を週末に簡単に振り返る時間を設けましょう！

*(注: Gemini APIキーを設定すると、さらに高度なリアルタイムAIフィードバックが生成されます)*`;
}
