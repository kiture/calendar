export interface Role {
  role_id: string; // uuid
  role_name: string;
}

export interface User {
  user_id: string; // uuid
  email: string;
  login: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role_id: string; // uuid
  created_at: Date;
  updated_at: Date;
}

export interface Group {
  group_id: string; // uuid
  group_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  event_id: string; // uuid
  group_id: string; // uuid
  creator_user_id: string | null; // uuid
  title: string;
  start_time: Date;
  place: string | null;
  description: string | null;
  is_ai_suggestion: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMembership {
  user_id: string; // uuid
  group_id: string; // uuid
  joined_at: Date;
}

export interface EventAttendance {
  user_id: string; // uuid
  event_id: string; // uuid
  joined_at: Date;
} 