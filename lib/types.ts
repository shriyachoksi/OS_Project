export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  roll_number: string | null;
  semester: number | null;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  due_date: string;
  file_url: string | null;
  status: "pending" | "submitted" | "graded";
  submitted_at: string | null;
  marks_obtained?: number | null;
  marks_total?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Timetable {
  id: string;
  user_id: string;
  class_name: string;
  instructor: string | null;
  room: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  class_name: string;
  date: string;
  status: "present" | "absent" | "leave";
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  assignment_id: string | null;
  reminder_date: string;
  is_sent: boolean;
  created_at: string;
}
