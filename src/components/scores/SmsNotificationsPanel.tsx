import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmsStatusBadge } from './SmsStatusBadge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SmsNotification {
  id: string;
  phone_number: string;
  message: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  parent?: {
    full_name: string;
  };
}

interface SmsNotificationsPanelProps {
  behaviorScoreId: string;
}

export function SmsNotificationsPanel({ behaviorScoreId }: SmsNotificationsPanelProps) {
  const [notifications, setNotifications] = useState<SmsNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [behaviorScoreId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_notifications')
        .select('*, parent:parents(full_name)')
        .eq('behavior_score_id', behaviorScoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as SmsNotification[]);
    } catch (error) {
      console.error('Error fetching SMS notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (notification: SmsNotification) => {
    setResendingId(notification.id);
    try {
      // Delete the old failed notification
      await supabase
        .from('sms_notifications')
        .delete()
        .eq('id', notification.id);

      // Get the behavior score to get student info
      const { data: scoreData } = await supabase
        .from('behavior_scores')
        .select('student_id, score, score_date')
        .eq('id', behaviorScoreId)
        .single();

      if (!scoreData) {
        throw new Error('Score not found');
      }

      // Call the edge function to resend
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          behaviorScoreId: behaviorScoreId,
          studentId: scoreData.student_id,
          score: scoreData.score,
          date: scoreData.score_date,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('SMS resent successfully');
      fetchNotifications();
    } catch (error: any) {
      console.error('Error resending SMS:', error);
      toast.error('Failed to resend SMS', { description: error.message });
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No SMS notifications sent yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
        >
        <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {notification.parent?.full_name || 'Unknown Parent'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {notification.phone_number}
            </p>
            {notification.sent_at && (
              <p className="text-xs text-muted-foreground">
                Sent: {format(new Date(notification.sent_at), 'MMM d, yyyy h:mm a')}
              </p>
            )}
            {notification.error_message && (
              <p className="text-xs text-destructive">
                Error: {notification.error_message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notification.status === 'failed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResend(notification)}
                disabled={resendingId === notification.id}
                className="text-xs"
              >
                {resendingId === notification.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Resend
              </Button>
            )}
            <SmsStatusBadge status={notification.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
