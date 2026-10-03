import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/console/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp file — Barnstorm Co-operations" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WhatsAppAdmin,
});

type Contact = {
  phone: string;
  name: string | null;
  profile_name: string | null;
  stage: string;
  role: string | null;
  geography: string | null;
  need_type: string | null;
  last_inbound: string | null;
  unread: boolean;
  escalated: boolean;
  reference_id: string | null;
  updated_at: string;
};

type Callback = {
  reference_id: string;
  name: string | null;
  callback_phone: string;
  preferred_time: string | null;
  geography: string | null;
  status: string;
  created_at: string;
};

type Message = {
  contact_id: string;
  direction: string;
  body: string;
  created_at: string;
};

function WhatsAppAdmin() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [simFrom, setSimFrom] = useState("919522236699");
  const [simText, setSimText] = useState("");
  const [simNote, setSimNote] = useState<string | null>(null);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        headers: { "x-admin-token": token },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        contacts?: Contact[];
        callbacks?: Callback[];
        messages?: Message[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Unauthorised.");
        setContacts(null);
        return;
      }
      setContacts(data.contacts ?? []);
      setCallbacks(data.callbacks ?? []);
      setMessages(data.messages ?? []);
    } catch {
      setError("The file could not be read.");
    } finally {
      setPending(false);
    }
  }

  async function simulate(e: FormEvent) {
    e.preventDefault();
    setSimNote(null);
    const res = await fetch("/api/admin/whatsapp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ from: simFrom, text: simText }),
    });
    const data = (await res.json()) as { ok?: boolean; stage?: string; reference?: string; error?: string };
    if (!res.ok || !data.ok) {
      setSimNote(data.error || "The inbound could not be filed.");
      return;
    }
    setSimNote(`Filed. Stage: ${data.stage ?? "—"}. Ref: ${data.reference ?? "—"}.`);
    setSimText("");
    await load();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Internal</p>
      <h1 className="type-page mt-3 text-fg">WhatsApp file</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Qualification threads, callbacks, escalations. Not a public desk. Token is not stored.
      </p>

      <form onSubmit={load} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="wa-admin-token">Director token</Label>
          <Input
            id="wa-admin-token"
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

      {contacts ? (
        <div className="mt-12 space-y-14">
          <section>
            <p className="eyebrow">Leads</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">Recent threads</h2>
            {contacts.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No WhatsApp threads on file.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[64rem] border-t border-border text-left text-sm">
                  <thead>
                    <tr className="font-mono text-xs uppercase tracking-wide text-subtle">
                      <th className="py-3 pr-4">Ref</th>
                      <th className="py-3 pr-4">Phone</th>
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Stage</th>
                      <th className="py-3 pr-4">Need</th>
                      <th className="py-3 pr-4">Geography</th>
                      <th className="py-3 pr-4">Flags</th>
                      <th className="py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((row) => (
                      <tr key={row.phone} className="border-t border-border align-top">
                        <td className="py-3 pr-4 font-mono text-xs text-fg">{row.reference_id ?? "—"}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted">{row.phone}</td>
                        <td className="py-3 pr-4 text-fg">
                          {row.name ?? row.profile_name ?? "—"}
                          {row.role ? <span className="mt-1 block text-xs text-subtle">{row.role}</span> : null}
                        </td>
                        <td className="py-3 pr-4 text-muted">{row.stage}</td>
                        <td className="py-3 pr-4 text-muted">{row.need_type ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted">{row.geography ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted">
                          {row.escalated ? "Escalated" : row.unread ? "Unread" : "Read"}
                          {row.last_inbound ? (
                            <span className="mt-1 block max-w-[16rem] truncate text-xs text-subtle">
                              {row.last_inbound}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 font-mono text-xs text-subtle">{String(row.updated_at).slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow">Callbacks</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">Requested windows</h2>
            {callbacks.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No callbacks on file.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[48rem] border-t border-border text-left text-sm">
                  <thead>
                    <tr className="font-mono text-xs uppercase tracking-wide text-subtle">
                      <th className="py-3 pr-4">Ref</th>
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Call</th>
                      <th className="py-3 pr-4">Window</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callbacks.map((row) => (
                      <tr key={row.reference_id} className="border-t border-border">
                        <td className="py-3 pr-4 font-mono text-xs text-fg">{row.reference_id}</td>
                        <td className="py-3 pr-4 text-fg">{row.name ?? "—"}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted">{row.callback_phone}</td>
                        <td className="py-3 pr-4 text-muted">{row.preferred_time ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted">{row.status}</td>
                        <td className="py-3 font-mono text-xs text-subtle">{String(row.created_at).slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow">Tape</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">Latest messages</h2>
            {messages.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No messages on file.</p>
            ) : (
              <ul className="mt-6 divide-y divide-border border-t border-border">
                {messages.map((row, i) => (
                  <li key={`${row.created_at}-${i}`} className="py-3">
                    <p className="font-mono text-xs text-subtle">
                      {row.direction === "in" ? "Inbound" : "Outbound"} · {String(row.created_at).slice(0, 16)}
                    </p>
                    <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm text-muted">{row.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <p className="eyebrow">Desk test</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">File an inbound</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Runs the same qualification engine Meta will hit. Use this to walk a thread without waiting on Cloud.
            </p>
            <form onSubmit={simulate} className="mt-6 max-w-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sim-from">From</Label>
                <Input id="sim-from" value={simFrom} onChange={(e) => setSimFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-text">Message</Label>
                <Textarea
                  id="sim-text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="min-h-24"
                />
              </div>
              <Button type="submit">File inbound</Button>
              {simNote ? <p className="text-sm text-muted">{simNote}</p> : null}
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
