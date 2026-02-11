
-- Create email_notifications table for tracking email delivery
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  behavior_score_id UUID NOT NULL REFERENCES public.behavior_scores(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  is_sms_backup BOOLEAN NOT NULL DEFAULT false,
  resend_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies matching SMS notifications pattern
CREATE POLICY "Admins can view all email notifications"
ON public.email_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view their own email notifications"
ON public.email_notifications FOR SELECT
USING (parent_id IN (SELECT parents.id FROM parents WHERE parents.user_id = auth.uid()));

CREATE POLICY "Teachers can create email notifications"
ON public.email_notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can view email notifications"
ON public.email_notifications FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));
