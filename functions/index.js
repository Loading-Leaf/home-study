/**
 * Firebase Cloud Functions (v2) - JST Sunday 18:00 Weekly Study Report Scheduler
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled Cloud Function triggered every Sunday at 18:00 JST (Asia/Tokyo)
 */
exports.sendWeeklyStudyReportJST = onSchedule({
  schedule: "every sunday 18:00",
  timeZone: "Asia/Tokyo",
}, async (event) => {
  logger.info("Executing JST Sunday 18:00 Weekly Study Report Scheduler...");

  try {
    const usersSnapshot = await db.collection("users").get();
    let sentCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      const userName = userData.name || "受講者";
      const targetHours = userData.targetStudyHours || 10;
      const weeklyHours = userData.weeklyHours || 0;

      if (!userEmail) continue;

      logger.info(`Sending weekly report to ${userName} (${userEmail}) - Weekly Hours: ${weeklyHours}/${targetHours}h`);

      // Write email document to 'mail' collection if using Firebase Trigger Email extension
      await db.collection("mail").add({
        to: userEmail,
        message: {
          subject: `【自宅学習インサイト】1週間の学習レポート (${userName}様)`,
          text: `
${userName} 様

今週の自宅学習お疲れ様でした！
1週間の学習実績レポートをお届けします。

■ 今週の学習目標: ${targetHours} 時間 (設定: 3〜15時間)
■ 今週の達成実績: ${weeklyHours} 時間 (達成率: ${Math.round((weeklyHours / targetHours) * 100)}%)
■ 累計学習時間: ${userData.totalHours || 0} 時間
■ 学習状況: ${userData.studyStatus || '進行中'}

来週も目標に向けて一歩ずつ前進しましょう！
引き続き自宅学習インサイトをご活用ください。
          `,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
              <h2 style="color: #6366f1;">📚 自宅学習 1週間レポート</h2>
              <p>${userName} 様</p>
              <p>今週の学習お疲れ様でした！以下が今週のまとめです。</p>
              
              <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p><strong>■ 週間目標:</strong> ${targetHours} 時間</p>
                <p><strong>■ 達成実績:</strong> ${weeklyHours} 時間 (${Math.round((weeklyHours / targetHours) * 100)}% 達成)</p>
                <p><strong>■ 累計学習時間:</strong> ${userData.totalHours || 0} 時間</p>
                <p><strong>■ ステータス:</strong> <span style="color: #34d399;">${userData.studyStatus || '進行中'}</span></p>
              </div>

              <p style="color: #94a3b8; font-size: 0.9em;">※ 本メールは日本時間 毎週日曜日 18:00 に自動配信されています。</p>
            </div>
          `
        }
      });

      sentCount++;
    }

    logger.info(`Successfully scheduled ${sentCount} weekly report emails.`);
  } catch (error) {
    logger.error("Error running weekly study report function:", error);
  }
});
