-- Add 'viewer' role for users without an admin-assigned role (read-only)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
