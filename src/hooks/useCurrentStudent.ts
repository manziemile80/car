import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Returns the student record linked to the signed-in user (student role). */
export function useCurrentStudent() {
  const { user, role } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(role === 'student');

  useEffect(() => {
    if (!user || role !== 'student') {
      setStudentId(null);
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setStudentId(data?.id ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, role]);

  return { studentId, loading };
}
