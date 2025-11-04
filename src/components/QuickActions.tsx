import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paths } from "@/routes/paths";

type QuickAction = {
  label: string;
  to: string;
  variant?: "primary" | "secondary";
};

const baseButtonClasses =
  "flex h-12 items-center justify-center rounded-md border px-4 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variantClasses: Record<NonNullable<QuickAction["variant"]>, string> = {
  primary: "bg-primary text-primary-foreground border-transparent shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
  secondary:
    "bg-muted text-foreground border-border hover:bg-muted/80 focus-visible:ring-muted-foreground/40",
};

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = useMemo<QuickAction[]>(
    () => [
      { label: "View Calls", to: paths.calls, variant: "secondary" },
      { label: "Add Number", to: paths.addNumber, variant: "secondary" },
      { label: "Invite Staff", to: paths.teamInvite, variant: "secondary" },
      { label: "Integrations", to: paths.integrations, variant: "secondary" },
    ],
    []
  );

  return (
    <div
      aria-label="Quick Actions"
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
      role="group"
    >
      {actions.map(({ label, to, variant = "secondary" }) => (
        <button
          key={label}
          type="button"
          className={`${baseButtonClasses} ${variantClasses[variant]}`}
          onClick={() => navigate(to)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
