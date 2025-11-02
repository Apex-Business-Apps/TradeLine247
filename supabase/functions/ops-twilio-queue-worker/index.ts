// deno-lint-ignore-file no-explicit-any
import { preflight, corsHeaders } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";
import { twilioFormPOST } from "../_shared/twilio_client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const MAX_PER_RUN = 5;

export default async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const selector = new URL(`${SUPABASE_URL}/rest/v1/twilio_job_queue`);
  selector.searchParams.set("status", "eq.pending");
  selector.searchParams.set("next_run_at", `lte.${new Date().toISOString()}`);
  selector.searchParams.set("order", "created_at.asc");
  selector.searchParams.set("limit", String(MAX_PER_RUN));

  const jobResponse = await fetch(selector, {
    headers: { apikey: ANON, Authorization: `Bearer ${SRV}` },
  });

  if (!jobResponse.ok) {
    const body = await jobResponse.text();
    console.error("Failed to load twilio_job_queue", jobResponse.status, body);
    return new Response(JSON.stringify({ error: "failed to load queue" }), {
      status: 502,
      headers: withJSON(corsHeaders),
    });
  }

  const jobs: any[] = await jobResponse.json();

  for (const job of jobs) {
    await fetch(`${SUPABASE_URL}/rest/v1/twilio_job_queue?id=eq.${job.id}`, {
      method: "PATCH",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${SRV}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "processing",
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString(),
      }),
    });

    try {
      if (job.kind === "call") {
        const form = new URLSearchParams({
          From: job.payload.from,
          To: job.payload.to,
          Url: job.payload.url,
          Method: "POST",
        });
        const response = await twilioFormPOST(`/Accounts/${ACCOUNT_SID}/Calls.json`, form);
        if (!response.ok) {
          throw new Error(`${response.status} ${await response.text()}`);
        }
      }

      await fetch(`${SUPABASE_URL}/rest/v1/twilio_job_queue?id=eq.${job.id}`, {
        method: "PATCH",
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${SRV}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "done",
          updated_at: new Date().toISOString(),
          last_error: null,
        }),
      });
    } catch (error) {
      console.error("twilio_job_queue error", error);
      const delay = Math.min(5 * 60 * 1000, 2 ** Math.min(job.attempts, 6) * 1000);
      await fetch(`${SUPABASE_URL}/rest/v1/twilio_job_queue?id=eq.${job.id}`, {
        method: "PATCH",
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${SRV}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "pending",
          next_run_at: new Date(Date.now() + delay).toISOString(),
          last_error: String(error),
          updated_at: new Date().toISOString(),
        }),
      });
    }
  }

  return new Response(JSON.stringify({ processed: jobs.length }), {
    headers: withJSON(corsHeaders),
  });
};
