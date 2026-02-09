import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SmsRequest {
  behaviorScoreId: string;
  studentId: string;
  score: number;
  date: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    // Africa's Talking
    const atApiKey = Deno.env.get("AFRICASTALKING_API_KEY");
    const atUsername = Deno.env.get("AFRICASTALKING_USERNAME");

    console.log("SMS Notification function called");
    console.log(`Africa's Talking configured: ${!!atApiKey && !!atUsername}`);
    console.log(`Twilio configured: ${!!twilioAccountSid && !!twilioAuthToken}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { behaviorScoreId, studentId, score, date }: SmsRequest = await req.json();
    console.log(`Processing SMS for student: ${studentId}, score: ${score}`);

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

    // Get primary contact parents
    const { data: parentLinks } = await supabase
      .from("student_parents")
      .select("parent:parents(*)")
      .eq("student_id", studentId)
      .eq("is_primary_contact", true);

    if (!parentLinks || parentLinks.length === 0) {
      console.log("No primary contact parent found for student");
      return new Response(
        JSON.stringify({ message: "No primary contact parent found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${parentLinks.length} primary contact parent(s)`);

    const results = [];

    for (const link of parentLinks) {
      const parent = link.parent as any;
      if (!parent || !parent.phone) {
        console.log("Parent has no phone number, skipping");
        continue;
      }

      const message = `Dear Parent, the behavior score for your child ${student.first_name} ${student.last_name} has been updated to ${score} on ${date}. Thank you.`;

      let smsStatus = "pending";
      let errorMessage = null;

      console.log(`Preparing to send SMS to ${parent.phone}`);

      // Try to send SMS via Twilio
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const twilioResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              },
              body: new URLSearchParams({
                To: parent.phone,
                From: twilioPhoneNumber,
                Body: message,
              }),
            }
          );

          if (twilioResponse.ok) {
            smsStatus = "sent";
            console.log(`SMS sent to ${parent.phone} via Twilio`);
          } else {
            const errorData = await twilioResponse.json();
            errorMessage = errorData.message || "Twilio error";
            smsStatus = "failed";
          }
        } catch (e: any) {
          errorMessage = e.message;
          smsStatus = "failed";
        }
      }
      // Try Africa's Talking
      else if (atApiKey && atUsername) {
        try {
          console.log(`Sending SMS to ${parent.phone} via Africa's Talking`);
          console.log(`Using username: ${atUsername}`);
          
          // Use sandbox URL if username is 'sandbox', otherwise use live URL
          const atBaseUrl = atUsername === 'sandbox' 
            ? 'https://api.sandbox.africastalking.com' 
            : 'https://api.africastalking.com';
          
          const atResponse = await fetch(
            `${atBaseUrl}/version1/messaging`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "apiKey": atApiKey,
                "Accept": "application/json",
              },
              body: new URLSearchParams({
                username: atUsername,
                to: parent.phone,
                message: message,
              }),
            }
          );

          const responseText = await atResponse.text();
          console.log(`Africa's Talking response status: ${atResponse.status}`);
          console.log(`Africa's Talking response: ${responseText}`);

          if (atResponse.ok) {
            try {
              const responseData = JSON.parse(responseText);
              // Check if the SMS was actually sent successfully
              if (responseData.SMSMessageData?.Recipients?.[0]?.status === "Success") {
                smsStatus = "sent";
                console.log(`SMS sent successfully to ${parent.phone}`);
              } else if (responseData.SMSMessageData?.Recipients?.[0]?.status) {
                smsStatus = "failed";
                errorMessage = responseData.SMSMessageData.Recipients[0].status;
              } else {
                smsStatus = "sent";
                console.log(`SMS queued for ${parent.phone}`);
              }
            } catch {
              // Response wasn't JSON but was successful
              smsStatus = "sent";
            }
          } else {
            errorMessage = responseText;
            smsStatus = "failed";
          }
        } catch (e: any) {
          console.error(`Africa's Talking error: ${e.message}`);
          errorMessage = e.message;
          smsStatus = "failed";
        }
      } else {
        // No SMS provider configured - log the notification
        console.log(`SMS notification queued (no provider configured): ${message}`);
        smsStatus = "pending";
        errorMessage = "No SMS provider configured";
      }

      // Create SMS notification record
      const { error: insertError } = await supabase
        .from("sms_notifications")
        .insert({
          behavior_score_id: behaviorScoreId,
          parent_id: parent.id,
          phone_number: parent.phone,
          message: message,
          status: smsStatus,
          sent_at: smsStatus === "sent" ? new Date().toISOString() : null,
          error_message: errorMessage,
        });

      if (insertError) {
        console.error("Error inserting SMS notification:", insertError);
      }

      // If SMS failed, try to send email as backup
      if (smsStatus === "failed" && parent.email) {
        console.log(`SMS failed, attempting email backup to ${parent.email}`);
        try {
          const emailResponse = await supabase.functions.invoke("send-email-notification", {
            body: {
              behaviorScoreId: behaviorScoreId,
              studentId: studentId,
              score: score,
              date: date,
              isSmsBackup: true,
            },
          });
          
          if (emailResponse.error) {
            console.error("Email backup also failed:", emailResponse.error);
          } else {
            console.log("Email backup sent successfully");
          }
        } catch (emailErr: any) {
          console.error("Error calling email backup:", emailErr.message);
        }
      }

      results.push({
        parentId: parent.id,
        phone: parent.phone,
        status: smsStatus,
        error: errorMessage,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-sms-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
