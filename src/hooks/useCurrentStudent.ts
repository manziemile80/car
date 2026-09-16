import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Returns the student record linked to the signed-in user (student role). */
export function useCurrentStudent() {
  const { user, role } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(role === 'student');

  const load = useCallback(async () => {
    if (!user || role !== 'student') {
      setStudentId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
    if (data?.id) {
      setStudentId(data.id);
      setLoading(false);
      return;
    }

    // No linked record yet — create one from the signed-in user's profile so
    // quiz answers and assignment submissions can always be saved.
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .maybeSingle();

    const fullName = (profile?.full_name || profile?.email || user.email || 'Student').trim();
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || '-';

    const { data: created } = await supabase
      .from('students')
      .insert({
        first_name: firstName,
        last_name: lastName,
        student_id: `SELF-${user.id.slice(0, 8).toUpperCase()}`,
        user_id: user.id,
        enrollment_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .maybeSingle();

    setStudentId(created?.id ?? null);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { studentId, loading, refresh: load };
}
