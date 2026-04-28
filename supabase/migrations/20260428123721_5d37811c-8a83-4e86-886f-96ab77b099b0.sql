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
    VALUES (NEW.id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$function$;