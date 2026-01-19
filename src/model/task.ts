import { HttpError } from "../helpers/errors";

// esquema para una tarea
export class Task {
  id: number;
  name: string;
  team_id: number;
  person_id: number;
  start_date: number; // timestamp en milisegundos
  end_date: number | null;  // opcional
  person_name ?: string;

  constructor(
    name: string,
    team_id: number,
    person_id: number,
    start_date: number,
    end_date: number | null 
  ) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpError(400, 'Name was not provided correctly');
    }
    if (typeof team_id !== 'number' || team_id <= 0) {
      throw new HttpError(400, 'Team ID was not provided correctly');
    }
    if (typeof person_id !== 'number' || person_id <= 0) {
      throw new HttpError(400, 'Person ID was not provided correctly');
    }
    if (typeof start_date !== 'number' || start_date <= 0) {
      throw new HttpError(400, 'Start date was not provided correctly');
    }

    if (end_date != null) {
      if (typeof end_date !== 'number') {
         throw new HttpError(400, 'End date must be a valid number');
      }
      if (end_date < start_date) {
        throw new HttpError(400, 'End date must be after start date');
      }
    }
    this.id = 0; // será definido por la base de datos
    this.name = name.trim();
    this.team_id = team_id;
    this.person_id = person_id;
    this.start_date = start_date;
    this.end_date = end_date ?? null;
  }
}
