// schema for a team
export class Team {
  id: number;
  shortname: string;
  fullname: string;
  color: string;

  constructor(shortname: string, fullname: string, color: string) {

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.shortname = shortname;
    this.fullname = fullname;
    this.color = color;
  }
}
