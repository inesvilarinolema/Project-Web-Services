import { HttpError } from "../helpers/errorhandling";

// schema for a person
export class Person {
  id: number;
  firstname: string;
  lastname: string;
  birthdate: Date;
  team_id: number | null;

  constructor(firstname: string, lastname: string, birthdate: Date, team_id: number | null) {
    if (!firstname || typeof firstname !== 'string' || firstname.trim().length === 0)
      throw new HttpError(400, 'First name was not provided correctly');
    if( !lastname || typeof lastname !== 'string' || lastname.trim().length === 0)
      throw new HttpError(400, 'Last name was not provided correctly');
    if( !birthdate || !(birthdate instanceof Date) || isNaN(birthdate.getTime()) || birthdate < new Date('1900-01-01') || birthdate >= new Date())
      throw new HttpError(400, 'Birth date was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.firstname = firstname;
    this.lastname = lastname;
    this.birthdate = birthdate;
    this.team_id = team_id;
  }
}
