import { db } from "../helpers/db";

export class Audit {

  static async log(userId: number, action: string, tableName: string, recordId: number, details: string = '') {
    try {
      if (!db.connection) return;

      await db.connection.run(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, details, timestamp) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        userId, action, tableName, recordId, details
      );
      
      console.log(`[AUDIT] ${action} on ${tableName} #${recordId}`);
    } catch (err) {
      console.error('Error saving audit log:', err);
    }
  }


  static async getAll(limit: number = 100) {
    if (!db.connection) return [];

    return await db.connection.all(`
      SELECT 
        audit_logs.*, 
        users.email as user_email 
      FROM audit_logs 
      LEFT JOIN users ON audit_logs.user_id = users.id 
      ORDER BY audit_logs.timestamp DESC 
      LIMIT ?`, 
      limit
    );
  }
}