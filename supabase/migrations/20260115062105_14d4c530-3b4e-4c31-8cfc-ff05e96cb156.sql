-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');

-- Create enum for behavior categories
CREATE TYPE public.behavior_category AS ENUM ('discipline', 'respect', 'attendance', 'participation');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    date_of_birth DATE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parents table (linked to auth.users for parent logins)
CREATE TABLE public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_parents junction table
CREATE TABLE public.student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'guardian',
    is_primary_contact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, parent_id)
);

-- Create behavior_scores table
CREATE TABLE public.behavior_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    category behavior_category NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    score_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_notifications table to log sent messages
CREATE TABLE public.sms_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    behavior_score_id UUID REFERENCES public.behavior_scores(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to get parent's children IDs
CREATE OR REPLACE FUNCTION public.get_parent_student_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.student_id
  FROM public.student_parents sp
  JOIN public.parents p ON p.id = sp.parent_id
  WHERE p.user_id = _user_id
$$;

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_behavior_scores_updated_at BEFORE UPDATE ON public.behavior_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- User roles: Only admins can manage, users can view their own
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view/update their own, admins can view all
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Classes: Admins and teachers can view, admins can manage
CREATE POLICY "Teachers and admins can view classes" ON public.classes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Students: Admins and teachers can view all, parents can view their own children
CREATE POLICY "Staff can view all students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Parents can view their children" ON public.students FOR SELECT TO authenticated USING (id IN (SELECT public.get_parent_student_ids(auth.uid())));
CREATE POLICY "Admins can manage students" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Parents: Admins can manage, parents can view/update their own
CREATE POLICY "Admins can manage parents" ON public.parents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their own record" ON public.parents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Parents can update their own record" ON public.parents FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Student-Parent links: Admins can manage, parents can view their own
CREATE POLICY "Admins can manage student-parent links" ON public.student_parents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their own links" ON public.student_parents FOR SELECT TO authenticated USING (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));

-- Behavior scores: Teachers can manage, admins can view all, parents can view their children's
CREATE POLICY "Teachers can manage behavior scores" ON public.behavior_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Admins can view all behavior scores" ON public.behavior_scores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their children's scores" ON public.behavior_scores FOR SELECT TO authenticated USING (student_id IN (SELECT public.get_parent_student_ids(auth.uid())));

-- SMS notifications: Admins can view all, parents can view their own
CREATE POLICY "Admins can view all sms notifications" ON public.sms_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their own sms notifications" ON public.sms_notifications FOR SELECT TO authenticated USING (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));