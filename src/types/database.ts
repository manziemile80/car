// Custom types for the Conduct app

export type AppRole = 'admin' | 'teacher' | 'parent' | 'viewer';

export type BehaviorCategory = 'discipline' | 'respect' | 'attendance' | 'participation';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade_level: string;
  academic_year: string;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  class_id: string | null;
  date_of_birth: string | null;
  enrollment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentParent {
  id: string;
  student_id: string;
  parent_id: string;
  relationship: string;
  is_primary_contact: boolean;
  created_at: string;
}

export interface BehaviorScore {
  id: string;
  student_id: string;
  teacher_id: string;
  category: BehaviorCategory;
  score: number;
  notes: string | null;
  score_date: string;
  created_at: string;
  updated_at: string;
}

export interface SmsNotification {
  id: string;
  behavior_score_id: string;
  parent_id: string;
  phone_number: string;
  message: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

// Extended types with relations
export interface StudentWithClass extends Student {
  class?: Class | null;
}

export interface BehaviorScoreWithDetails extends BehaviorScore {
  student?: StudentWithClass;
  teacher?: Profile;
}
