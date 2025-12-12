/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import { preflight, corsHeaders } from "../_shared/cors.ts";
import { secureHeaders, mergeHeaders } from "../_shared/secure_headers.ts";
import { twilioFormPOST, TwilioResponseError } from "../_shared/twilio_client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { ensureRequestId } from "../_shared/requestId.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_PER_RUN = 5; // tune for CPS

const supabase = createClient(SUPABASE_URL, SRV);

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const requestId = ensureRequestId(req.headers);

  // Fetch pending jobs
  const { data: jobs, error } = await supabase
    .from("twilio_job_queue")
    .select("*")
    .eq("status", "pending")
    .lte("next_run_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("Error fetching jobs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch jobs" }),
      {
        status: 500,
        headers: mergeHeaders(corsHeaders, secureHeaders, {
          "Content-Type": "application/json",
        }),
      }
    );
  }

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: mergeHeaders(corsHeaders, secureHeaders, {
        "Content-Type": "application/json",
      }),
    });
  }

  // Process each job
  for (const j of jobs) {
    // Mark as processing
    await supabase
      .from("twilio_job_queue")
      .update({
        status: "processing",
        attempts: j.attempts + 1,
        updated_at: new Date().toISOString(),
        locked_at: new Date().toISOString(),
        locked_by: requestId,
      })
      .eq("id", j.id);

    try {
      if (j.kind === "call") {
        const form = new URLSearchParams({
          From: j.payload.from,
          To: j.payload.to,
          Url: j.payload.url,
          Method: "POST",
        });
        await twilioFormPOST(
          `/Accounts/${Deno.env.get("TWILIO_ACCOUNT_SID")}/Calls.json`,
          form,
        );
      }
      // extend: 'callerid.verify', 'number.update', etc.

      // Mark as done
      await supabase
        .from("twilio_job_queue")
        .update({
          status: "done",
          updated_at: new Date().toISOString(),
          last_error: null,
          locked_at: null,
          locked_by: null,
        })
        .eq("id", j.id);
    } catch (e) {
      console.error(
        "twilio-job-failed",
        requestId,
        j.id,
        j.kind,
        e instanceof TwilioResponseError
          ? { status: e.response.status, message: e.message }
          : { message: String(e) },
      );
      const delay = Math.min(
        5 * 60 * 1000,
        2 ** Math.min(j.attempts, 6) * 1000
      );
      await supabase
        .from("twilio_job_queue")
        .update({
          status: "pending",
          next_run_at: new Date(Date.now() + delay).toISOString(),
          last_error: String(e),
          updated_at: new Date().toISOString(),
          locked_at: null,
          locked_by: null,
        })
        .eq("id", j.id);
    }
  }

  return new Response(
    JSON.stringify({
      processed: jobs.length,
      requestId,
    }),
    {
      headers: mergeHeaders(corsHeaders, secureHeaders, {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      }),
    },
  );
});

