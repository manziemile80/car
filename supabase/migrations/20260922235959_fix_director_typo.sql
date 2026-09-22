-- Fix any user_roles with typo 'director_of_studie' to 'director_of_studies'
-- This migration corrects the enum validation error by updating records with the incomplete spelling
UPDATE public.user_roles
SET role = 'director_of_studies'::app_role
WHERE role::text = 'director_of_studie';
