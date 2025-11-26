export interface Person {
  id: number;
  firstname: string;
  lastname: string;
  birthdate: Date;
  team_ids?: number[];
  team_objects?: any[];
}
