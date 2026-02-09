import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  behaviorScoreId: string;
  studentId: string;
  score: number;
  date: string;
  isSmsBackup?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { behaviorScoreId, studentId, score, date, isSmsBackup }: EmailRequest = await req.json();
    console.log(`Processing email notification for student: ${studentId}, score: ${score}`);
    console.log(`Is SMS backup: ${isSmsBackup}`);

    // Get student details
    const { data: student } = await supabase
      .from("students")
      .select("first_name, last_name, class:classes(name)")
      .eq("id", studentId)
      .single();

    if (!student) {
      throw new Error("Student not found");
    }

    console.log(`Student found: ${student.first_name} ${student.last_name}`);

    // Get primary contact parents with email
    const { data: parentLinks } = await supabase
      .from("student_parents")
      .select("parent:parents(*)")
      .eq("student_id", studentId)
      .eq("is_primary_contact", true);

    if (!parentLinks || parentLinks.length === 0) {
      console.log("No primary contact parent found for student");
      return new Response(
        JSON.stringify({ message: "No primary contact parent found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${parentLinks.length} primary contact parent(s)`);

    const results = [];

    for (const link of parentLinks) {
      const parent = link.parent as any;
      if (!parent || !parent.email) {
        console.log("Parent has no email, skipping");
        continue;
      }

      const subject = isSmsBackup 
        ? `[Important] Behavior Score Update for ${student.first_name} ${student.last_name}`
        : `Behavior Score Update for ${student.first_name} ${student.last_name}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Behavior Score Update</h2>
          ${isSmsBackup ? '<p style="color: #e74c3c; font-size: 14px;"><em>Note: SMS delivery failed, sending this email as backup notification.</em></p>' : ''}
          <p>Dear ${parent.full_name},</p>
          <p>We would like to inform you that the behavior score for your child has been updated:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Student:</strong> ${student.first_name} ${student.last_name}</p>
            <p style="margin: 5px 0;"><strong>Score:</strong> ${score}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          </div>
          <p>Thank you for your continued support in your child's education.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from the Student Behavior Management System.
          </p>
        </div>
      `;

      console.log(`Sending email to ${parent.email}`);

      try {
        const emailResponse = await resend.emails.send({
          from: "Behavior Tracker <onboarding@resend.dev>",
          to: [parent.email],
          subject: subject,
          html: htmlContent,
        });

        console.log(`Email sent successfully to ${parent.email}:`, emailResponse);

        results.push({
          parentId: parent.id,
          email: parent.email,
          status: "sent",
          messageId: emailResponse.data?.id,
        });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${parent.email}:`, emailError);
        results.push({
          parentId: parent.id,
          email: parent.email,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
