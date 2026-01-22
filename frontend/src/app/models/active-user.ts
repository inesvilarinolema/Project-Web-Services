export interface ActiveUser{
    user_id: number;
    username: string;
    token: string;
    valid_until: number;
    isCurrentSession: boolean;
}