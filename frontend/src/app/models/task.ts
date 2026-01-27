export interface Task{
    id: number;
    name: string;
    team_id: number; //link to team
    person_id: number; //link to the person model
    start_date: string;
    end_date ?: string | null;
}