import React, { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseEnabled } from "@/integrations/supabase/client";

type Carrier = "ROGERS_FIDO" | "TELUS_KOODO" | "BELL_MOBILITY" | "LANDLINE";
const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE!;
const FORWARD_TO = import.meta.env.VITE_TWILIO_VOICE_NUMBER_E164!;

type Status = "idle" | "pending" | "verified" | "failed";

type ForwardingCheck = {
  status: Status;
  notes: string | null;
};

export default function ForwardingWizard() {
  const [oldNumber, setOldNumber] = useState("+1");
  const [orgId, setOrgId] = useState("");
  const [carrier, setCarrier] = useState<Carrier>("ROGERS_FIDO");
  const [status, setStatus] = useState<Status>("idle");
  const [note, setNote] = useState("Ready to verify.");
  const [checkId, setCheckId] = useState<string | null>(null);

  const actions = useMemo(() => {
    switch (carrier) {
      case "ROGERS_FIDO":
      case "TELUS_KOODO":
        return {
          activateHref: `tel:*21*${FORWARD_TO}#`,
          deactivateHref: "tel:##21#",
          instructions: "Tap from the device owning the number (GSM *21* / ##21#).",
        } as const;
      case "BELL_MOBILITY":
        return {
          instructions: `Open Phone → Settings → Call Forwarding → Always forward → set ${FORWARD_TO}.`,
        } as const;
      case "LANDLINE":
      default:
        return {
          instructions: `From handset: Dial *72, then ${FORWARD_TO}. If busy/no answer, repeat once. Disable with *73.`,
        } as const;
    }
  }, [carrier]);

  useEffect(() => {
    if (!checkId || status !== "pending") return;
    if (!isSupabaseEnabled) {
      setNote("Supabase disabled in this environment. Verify manually via inbound call logs.");
      return;
    }
    let cancelled = false;
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("forwarding_checks" as any)
        .select("status, notes")
        .eq("id", checkId)
        .maybeSingle<ForwardingCheck>();
      if (cancelled) return;
      if (error) {
        console.error("Forwarding status poll failed", error);
        setNote(error.message ?? "Unable to poll verification status.");
        return;
      }
      if (!data) return;
      setStatus(data.status);
      const detail = data.notes ? ` — ${data.notes}` : "";
      if (data.status === "verified") {
        setNote(`Verified via inbound forwarding${detail}`);
        clearInterval(interval);
      } else if (data.status === "failed") {
        setNote(`Verification failed${detail}`);
        clearInterval(interval);
      } else {
        setNote(`Awaiting forwarded inbound${detail}`);
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checkId, status]);

  async function startVerification() {
    if (!FUNCTIONS_BASE) {
      setStatus("failed");
      setNote("Missing FUNCTIONS_BASE configuration");
      return;
    }
    const normalizedOrg = orgId || "00000000-0000-0000-0000-000000000000";
    setStatus("pending");
    setNote("Placing a short test call to the old number; awaiting forwarded inbound…");
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/forwarding-verify-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: normalizedOrg, old_number_e164: oldNumber }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("failed");
        const message = (payload as any)?.error?.message ?? (payload as any)?.error ?? "Verification start failed";
        setNote(typeof message === "string" ? message : "Verification start failed");
        return;
      }
      setCheckId((payload as any)?.check_id ?? null);
      setStatus(((payload as any)?.status as Status) || "pending");
      setNote("Verification pending (~20s). When forwarding is active, inbound will mark Verified.");
    } catch (error) {
      console.error("Verification start failed", error);
      setStatus("failed");
      setNote(error instanceof Error ? error.message : "Verification start failed");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Forwarding Wizard</h1>

      <div className="space-x-2">
        {(["ROGERS_FIDO", "TELUS_KOODO", "BELL_MOBILITY", "LANDLINE"] as Carrier[]).map((c) => (
          <button
            key={c}
            onClick={() => setCarrier(c)}
            className={`px-3 py-2 rounded-xl border ${carrier === c ? "bg-black text-white" : "bg-white"}`}
          >
            {c.replace("_", "/")}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <label className="text-sm">Client’s current (old) number (E.164):</label>
        <input
          className="border rounded-xl px-3 py-2"
          value={oldNumber}
          onChange={(e) => setOldNumber(e.target.value)}
          placeholder="+1XXXXXXXXXX"
        />
        <label className="text-sm">Org Id (UUID):</label>
        <input
          className="border rounded-xl px-3 py-2"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="UUID"
        />
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-semibold">Activate forwarding</h2>
        <p className="text-sm">{actions.instructions}</p>
        <div className="flex gap-3">
          {"activateHref" in actions && (actions as any).activateHref ? (
            <a className="px-4 py-2 rounded-xl border" href={(actions as any).activateHref}>
              Activate
            </a>
          ) : null}
          {"deactivateHref" in actions && (actions as any).deactivateHref ? (
            <a className="px-4 py-2 rounded-xl border" href={(actions as any).deactivateHref}>
              Deactivate
            </a>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-semibold">Auto-verification</h2>
        <button onClick={startVerification} className="px-4 py-2 rounded-xl border">
          Place test call &amp; verify
        </button>
        <div className="text-sm">
          Status: <b>{status}</b> — {note}
        </div>
      </div>

      <CallerIdPanel />
    </div>
  );
}

function CallerIdPanel() {
  const [num, setNum] = useState("+1");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("Twilio will place a quick call to confirm ownership.");
  async function start() {
    try {
      const res = await fetch(`${import.meta.env.VITE_FUNCTIONS_BASE}/callerid-verify-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number_e164: num, friendly_name: label }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg("Error: " + (j?.error?.message ?? j?.error ?? "unknown"));
        return;
      }
      const code = j?.data?.validation_code;
      setMsg(`Twilio will call ${num}. Enter code ${code} to complete verification.`);
    } catch (error) {
      console.error("Caller ID verification failed", error);
      setMsg("Error: " + (error instanceof Error ? error.message : "unknown"));
    }
  }
  return (
    <div className="rounded-2xl border p-4 space-y-2">
      <h2 className="font-semibold">Outbound Caller ID (show legacy number)</h2>
      <input
        className="border rounded-xl px-3 py-2 w-full"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        placeholder="+1XXXXXXXXXX"
      />
      <input
        className="border rounded-xl px-3 py-2 w-full"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (optional)"
      />
      <button onClick={start} className="px-4 py-2 rounded-xl border">
        Verify caller ID
      </button>
      <div className="text-sm">{msg}</div>
    </div>
  );
}
