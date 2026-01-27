
export interface AuditLog{
    id: number;
    user_id: number; //id of the user who performed action
    user_email?: string; 
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    table_name: string; //the entity affected
    record_id: number; //id of the specific item that was modified
    timestamp: string; 
    details: string;
}