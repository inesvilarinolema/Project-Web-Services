import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { faker } from "@faker-js/faker";

import { Person } from '../model/person';

// open sqlite database and create tables if they do not exist

export const db: { connection: Database | null } = {
    connection: null
};

export async function openDb(): Promise<Database> {
  return open({
    filename: './db/data.sqlite3',
    driver: sqlite3.Database
  });
}

export async function createSchemaAndData() {
  // Create a structure
  await db!.connection!.run(`
    CREATE TABLE IF NOT EXISTS persons
      (id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT, lastname TEXT, birthdate DATE, team_id INTEGER)
    `);
  try {
    await db!.connection!.run(`
      CREATE TABLE teams
        (id INTEGER PRIMARY KEY AUTOINCREMENT, shortname TEXT, fullname TEXT, color TEXT)
      `);
    await db!.connection!.run(`
      INSERT INTO teams (shortname, fullname, color) VALUES
        ('MCI', 'Manchester City', 'lightblue'),
        ('MUN', 'Manchester United', 'red'),
        ('CHE', 'Chelsea', 'blue');
      `);   
  } catch(_ex) {}
  // Check if it is required to insert sample data
  const dbFakeNum: number = parseInt(process.env.DBFAKENUM || '0') || 0;
  if (dbFakeNum > 0) {
    // Insert sample records
    for(let i = 0; i < dbFakeNum; i++) {
      const fakePerson = new Person(
        faker.person.firstName(),
        faker.person.lastName(),
        faker.date.birthdate({ min: 1950, max: 2020, mode: 'year' }),
        null
      );
      await db.connection!.run(
        'INSERT INTO persons (firstname, lastname, birthdate) VALUES (?, ?, ?)',
        fakePerson.firstname, fakePerson.lastname, fakePerson.birthdate
      );
    }
    console.log(`Inserted ${dbFakeNum} fake persons`); 
  }
}
