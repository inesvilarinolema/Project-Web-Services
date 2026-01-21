
export interface AuditLog{
    id: number;
    user_id: number;
    user_email?: string; 
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    table_name: string;
    record_id: number;
    timestamp: string; 
    details: string;
}