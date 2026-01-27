export interface ActiveUser{
    user_id: number; //the unique ID
    username: string; //login name
    token: string; //the session id (sid), used as a key to force logout
    valid_until: number; //timestamp when te session expires
    isCurrentSession: boolean; //true if this session belongs to the user currently viewing the list
}