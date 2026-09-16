CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  requested text;
  final_role public.app_role;
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );

    requested := lower(coalesce(NEW.raw_user_meta_data->>'requested_role', ''));
    IF requested IN ('student', 'parent') THEN
      final_role := requested::public.app_role;
    ELSE
      final_role := 'viewer'::public.app_role;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, final_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$function$;