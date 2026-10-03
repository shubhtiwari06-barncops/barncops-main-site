import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/console/intake")({
  head: () => ({
    meta: [
      { title: "Intake file — Barnstorm Co-operations" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IntakeAdmin,
});

type Item = {
  created_at: string;
  type: string;
  name: string;
  role: string | null;
  geography: string | null;
  timeline: string | null;
  need_type: string | null;
  email: string;
  phone: string | null;
  reference_id: string;
  status: string;
  challenge: string | null;
};

function IntakeAdmin() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [pending, setPending] = useState(false);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/intake", {
        headers: { "x-admin-token": token },
      });
      const data = (await res.json()) as { ok?: boolean; items?: Item[]; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Unauthorised.");
        setItems(null);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("The file could not be read.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Internal</p>
      <h1 className="type-page mt-3 text-fg">Intake file</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Last fifty briefs. Not a public desk. Token is not stored.
      </p>

      <form onSubmit={load} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="admin-token">Director token</Label>
          <Input
            id="admin-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Opening…" : "Open file"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {items ? (
        <div className="mt-10 overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted">No briefs on file.</p>
          ) : (
            <table className="w-full min-w-[52rem] border-t border-border text-left text-sm">
              <thead>
                <tr className="font-mono text-xs uppercase tracking-wide text-subtle">
                  <th className="py-3 pr-4">Ref</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Need</th>
                  <th className="py-3 pr-4">Geography / topic</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Filed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.reference_id} className="border-t border-border align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-fg">{row.reference_id}</td>
                    <td className="py-3 pr-4 text-muted">{row.type}</td>
                    <td className="py-3 pr-4 text-fg">
                      {row.name}
                      {row.role ? <span className="mt-1 block text-xs text-subtle">{row.role}</span> : null}
                    </td>
                    <td className="py-3 pr-4 text-muted">{row.need_type ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted">{row.geography ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted">{row.email}</td>
                    <td className="py-3 pr-4 text-muted">{row.status}</td>
                    <td className="py-3 font-mono text-xs text-subtle">{String(row.created_at).slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </main>
  );
}
