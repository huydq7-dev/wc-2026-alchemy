import db from '../db.js';

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  details: Record<string, any> = {},
) {
  try {
    await db.execute({
      sql: 'INSERT INTO activity_log (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      args: [userId, userName, action, JSON.stringify(details)],
    });
  } catch {
    // silently fail - don't block the main action
  }
}
