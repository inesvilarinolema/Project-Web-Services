import { db } from "../helpers/db";

export class Audit {

	/*
	Records a user action in the db for auditing purposes.
	*/
	static async log(userId: number, action: string, tableName: string, recordId: number, details: string = '') {
		try {
			if (!db.connection) return;

			//Insert the audit record with the current timestamp
			await db.connection.run(
				`INSERT INTO audit_logs (user_id, action, table_name, record_id, details, timestamp) 
				 VALUES (?, ?, ?, ?, ?, datetime('now'))`,
				userId, action, tableName, recordId, details
			);
			
			//console.log(`[AUDIT] ${action} on ${tableName} #${recordId}`);
		} catch (err) {
			console.error('Error saving audit log:', err);
		}
	}

	/*Retrieves the most recent audit logs*/
	static async getAll(limit: number = 100) {
		if (!db.connection) return [];
		
		//Fetch logs ordered by newest first
		return await db.connection.all(`
			SELECT * FROM audit_logs 
			ORDER BY timestamp DESC 
			LIMIT ?`, 
			limit
		);
	}
}