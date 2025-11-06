-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  roll_number text UNIQUE,
  semester integer,
  department text,
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);



-- Create timetable table
CREATE TABLE IF NOT EXISTS public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  instructor text,
  room text,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  due_date timestamp NOT NULL,
  file_url text,
  status text DEFAULT 'pending',
  submitted_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  reminder_date timestamp NOT NULL,
  is_sent boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for timetable
CREATE POLICY "Users can view their own timetable" ON public.timetable
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create timetable entries" ON public.timetable
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable" ON public.timetable
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable" ON public.timetable
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assignments
CREATE POLICY "Users can view their own assignments" ON public.assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create assignments" ON public.assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON public.assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON public.assignments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attendance records" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON public.attendance
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_timetable_user_id ON public.timetable(user_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
