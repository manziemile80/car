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
    setStudentId(data?.id ?? null);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { studentId, loading, refresh: load };
}
