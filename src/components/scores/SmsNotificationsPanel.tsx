import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmsStatusBadge } from './SmsStatusBadge';
import { Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

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
          <div className="space-y-1">
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
          <SmsStatusBadge status={notification.status} />
        </div>
      ))}
    </div>
  );
}
