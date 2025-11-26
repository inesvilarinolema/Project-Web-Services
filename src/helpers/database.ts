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
  // to switch on checking foreign key references
  await db!.connection!.run('PRAGMA foreign_keys = ON');

  // Create a structure and sample data

  // persons
  try {
      await db!.connection!.run(`
        CREATE TABLE persons
          (id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT, lastname TEXT, birthdate DATE)
        `);
      console.log('Table persons created');
      // Check if it is required to insert sample data
      const dbFakeNum: number = parseInt(process.env.DBFAKENUM || '0') || 0;
      if (dbFakeNum > 0) {
        // Insert sample records
        for(let i = 0; i < dbFakeNum; i++) {
          const fakePerson = new Person(
            faker.person.firstName(),
            faker.person.lastName(),
            faker.date.birthdate({ min: 1950, max: 2020, mode: 'year' })
          );
          await db.connection!.run(
            'INSERT INTO persons (firstname, lastname, birthdate) VALUES (?, ?, ?)',
            fakePerson.firstname, fakePerson.lastname, fakePerson.birthdate
          );
        }
        console.log(`${dbFakeNum} fake records created`);
      }
  } catch(_ex) {}

  // teams
  try {
    await db!.connection!.run(`
      CREATE TABLE teams
        (id INTEGER PRIMARY KEY AUTOINCREMENT, shortname TEXT, fullname TEXT, color TEXT)
      `);
      console.log('Table teams created, insert some data');
      await db!.connection!.run(`
        INSERT INTO teams (shortname, fullname, color) VALUES
          ('MCI', 'Manchester City', 'Lightblue'),
          ('MUN', 'Manchester United', 'Red'),
          ('CHE', 'Chelsea', 'Blue');
        `);   
    } catch(_ex) {}

    // membership
    try {
        await db!.connection!.run(`
          CREATE TABLE membership (
            person_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            PRIMARY KEY (person_id, team_id),
            FOREIGN KEY (person_id) REFERENCES persons(id),
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )`);
        console.log('Table membership created');
    } catch(_ex) {}
}
