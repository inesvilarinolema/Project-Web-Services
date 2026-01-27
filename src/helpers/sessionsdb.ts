import { Database } from 'sqlite3';
import { open } from 'sqlite';

export const sessionsdb = {
  	connection: null as any
};

export async function openSessionsDb() {
	sessionsdb.connection = await open({
		filename: './db/sessions.sqlite3', 
		driver: Database
  	});
  	console.log('Sessions DB connected');
}