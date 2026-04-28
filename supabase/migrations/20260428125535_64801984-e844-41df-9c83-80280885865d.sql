-- Make new signups default to 'viewer' (read-only) instead of 'teacher'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$function$;

-- Read-only access for viewers
CREATE POLICY "Viewers can view students"
ON public.students FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view classes"
ON public.classes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view behavior scores"
ON public.behavior_scores FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view parents"
ON public.parents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'));
