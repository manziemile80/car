import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Retry failed SMS job started");

    // Get failed SMS notifications from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: failedNotifications, error: fetchError } = await supabase
      .from("sms_notifications")
      .select("*, behavior_score:behavior_scores(student_id, score, score_date)")
      .eq("status", "failed")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching failed notifications:", fetchError);
      throw fetchError;
    }

    if (!failedNotifications || failedNotifications.length === 0) {
      console.log("No failed SMS notifications to retry");
      return new Response(
        JSON.stringify({ message: "No failed notifications to retry", retried: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${failedNotifications.length} failed notification(s) to retry`);

    const results = [];

    for (const notification of failedNotifications) {
      const behaviorScore = notification.behavior_score;
      
      if (!behaviorScore) {
        console.log(`Skipping notification ${notification.id} - no behavior score found`);
        continue;
      }

      console.log(`Retrying SMS for notification ${notification.id}`);

      // Delete the old failed notification
      await supabase
        .from("sms_notifications")
        .delete()
        .eq("id", notification.id);

      // Call the send-sms-notification function
      const { data, error } = await supabase.functions.invoke("send-sms-notification", {
        body: {
          behaviorScoreId: notification.behavior_score_id,
          studentId: behaviorScore.student_id,
          score: behaviorScore.score,
          date: behaviorScore.score_date,
        },
      });

      if (error) {
        console.error(`Error retrying notification ${notification.id}:`, error);
        results.push({ id: notification.id, status: "error", error: error.message });
      } else {
        console.log(`Successfully retried notification ${notification.id}`);
        results.push({ id: notification.id, status: "retried", result: data });
      }
    }

    console.log("Retry job completed", results);

    return new Response(
      JSON.stringify({ success: true, retried: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in retry-failed-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
