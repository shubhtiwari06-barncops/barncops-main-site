import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppCta } from "@/components/contact/whatsapp-cta";
import { TurnstileField } from "@/components/contact/turnstile-field";
import { cn } from "@/lib/cn";
import { useT, type DictKey } from "@/lib/i18n";
import { loadPublicConfig } from "@/lib/intake/client";
import { CHANNELS, NEEDS, ROLES, TIMELINES } from "@/lib/intake/schema";

const ROLE_KEYS: Record<(typeof ROLES)[number], DictKey> = {
  candidate: "roleCandidate",
  MP: "roleMp",
  MLA: "roleMla",
  party_unit: "roleParty",
  office: "roleOfficeDesk",
  principal: "rolePrincipal",
  investor: "roleInvestor",
  other: "roleOther",
};

const NEED_KEYS: Record<(typeof NEEDS)[number], DictKey> = {
  advisory: "needAdvisory",
  mandata: "needOs",
  both: "needBoth",
};

const TIME_KEYS: Record<(typeof TIMELINES)[number], DictKey> = {
  "90": "time90",
  "180": "timeCycle",
  cycle: "timeNext",
  governing: "timeGov",
};

const CHANNEL_KEYS: Record<(typeof CHANNELS)[number], DictKey> = {
  email: "channelEmail",
  phone: "channelPhone",
  whatsapp: "channelWhatsapp",
};

type FormState = {
  role: (typeof ROLES)[number];
  needType: (typeof NEEDS)[number];
  room: string;
  geography: string;
  timeline: (typeof TIMELINES)[number];
  challenge: string;
  name: string;
  email: string;
  phone: string;
  contactChannel: (typeof CHANNELS)[number];
  consent: boolean;
};

type Step = 1 | 2 | 3;

export function IntakeForm({ initialNeed }: { initialNeed?: string }) {
  const t = useT();
  const defaultNeed: FormState["needType"] =
    initialNeed === "advisory" || initialNeed === "both"
      ? initialNeed
      : initialNeed === "platform" || initialNeed === "mandata"
        ? "mandata"
        : "both";
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [form, setForm] = useState<FormState>({
    role: "candidate",
    needType: defaultNeed,
    room: "",
    geography: "",
    timeline: "180",
    challenge: "",
    name: "",
    email: "",
    phone: "",
    contactChannel: "email",
    consent: false,
  });

  useEffect(() => {
    loadPublicConfig().then((cfg) => setSiteKey(cfg.turnstileSiteKey));
  }, []);

  const rec = useMemo(() => recommend(form), [form]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function next() {
    if (step === 1) {
      if (form.room.trim().length < 2) {
        setError(t("roomRequired"));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (form.geography.trim().length < 3) {
        setError(t("nameTheRace"));
        return;
      }
      if (form.challenge.trim().length < 12) {
        setError(t("challengeRequired"));
        return;
      }
      setStep(3);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const consented =
      form.consent || (e.currentTarget.elements.namedItem("consent") as HTMLInputElement | null)?.checked;
    if (!consented) {
      setError(t("consentRequired"));
      return;
    }
    if ((form.contactChannel === "phone" || form.contactChannel === "whatsapp") && form.phone.trim().length < 8) {
      setError(t("phoneRequired"));
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourcePage: typeof window !== "undefined" ? window.location.pathname : "/contact",
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; ref?: string; error?: string };
      if (!res.ok || !data.ok || !data.ref) {
        setError(data.error || t("intakeError"));
        return;
      }
      setSubmitted(data.ref);
    } catch {
      setError(t("intakeError"));
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-3xl tracking-tight text-fg">{t("briefConfirm", { id: submitted })}</h2>
        <p className="mt-6 text-sm text-muted">
          {t("recPath")}: <span className="text-fg">{t(rec.titleKey)}</span> — {t(rec.bodyKey)}
        </p>
        <div className="mt-8">
          <WhatsAppCta prominent />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-border bg-surface p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">{t("stepOf", { n: step })}</p>
        <p className="font-mono text-xs text-subtle">{t("confidential")}</p>
      </div>

      {step === 1 ? (
        <div className="mt-6 space-y-8">
          <fieldset>
            <legend className="font-display text-2xl tracking-tight text-fg">{t("whoRoom")}</legend>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ROLES.map((id) => (
                <Choice key={id} selected={form.role === id} onClick={() => patch("role", id)} label={t(ROLE_KEYS[id])} />
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="room">{t("roomLabel")}</Label>
            <Input id="room" value={form.room} onChange={(e) => patch("room", e.target.value)} placeholder={t("roomPh")} />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-fg">{t("whatNeed")}</legend>
            <div className="mt-4 grid gap-2">
              {NEEDS.map((id) => (
                <Choice
                  key={id}
                  selected={form.needType === id}
                  onClick={() => patch("needType", id)}
                  label={t(NEED_KEYS[id])}
                />
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-6">
          <h2 className="font-display text-2xl tracking-tight text-fg">{t("raceOffice")}</h2>
          <div className="space-y-2">
            <Label htmlFor="geography">{t("jurisdiction")}</Label>
            <Input
              id="geography"
              value={form.geography}
              onChange={(e) => patch("geography", e.target.value)}
              placeholder={t("jurisdictionPh")}
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-fg">{t("clock")}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TIMELINES.map((id) => (
                <Choice
                  key={id}
                  selected={form.timeline === id}
                  onClick={() => patch("timeline", id)}
                  label={t(TIME_KEYS[id])}
                />
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="challenge">{t("problem")}</Label>
            <Textarea
              id="challenge"
              value={form.challenge}
              onChange={(e) => patch("challenge", e.target.value)}
              placeholder={t("problemPh")}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {t("suggested")}: <span className="text-fg">{t(rec.titleKey)}</span>. {t(rec.bodyKey)}
          </p>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-5">
          <h2 className="font-display text-2xl tracking-tight text-fg">{t("howReach")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" value={form.name} onChange={(e) => patch("name", e.target.value)} autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => patch("email", e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" value={form.phone} onChange={(e) => patch("phone", e.target.value)} autoComplete="tel" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-fg">{t("channelLabel")}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CHANNELS.map((id) => (
                <Choice
                  key={id}
                  selected={form.contactChannel === id}
                  onClick={() => patch("contactChannel", id)}
                  label={t(CHANNEL_KEYS[id])}
                />
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
            <input
              id="intake-consent"
              name="consent"
              type="checkbox"
              checked={form.consent}
              onChange={(e) => patch("consent", e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-accent"
            />
            <span>{t("consentLabel")}</span>
          </label>
          {siteKey ? <TurnstileField siteKey={siteKey} onToken={setTurnstileToken} /> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        {step > 1 ? (
          <Button type="button" variant="secondary" onClick={() => setStep((current) => (current === 3 ? 2 : 1))}>
            {t("back")}
          </Button>
        ) : null}
        {step < 3 ? (
          <Button type="button" onClick={next}>
            {t("continue")}
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? t("sending") : t("sendBrief")}
          </Button>
        )}
      </div>
    </form>
  );
}

function Choice({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-12 px-4 text-left text-sm transition-colors duration-150",
        selected ? "bg-fg text-bg" : "text-fg shadow-[var(--shadow-border)] hover:bg-elevated",
      )}
    >
      {label}
    </button>
  );
}

function recommend(form: FormState): { titleKey: DictKey; bodyKey: DictKey } {
  if (form.role === "investor") return { titleKey: "recInvestor", bodyKey: "recInvestorBody" };
  if (form.needType === "mandata" && (form.role === "MP" || form.role === "MLA" || form.role === "office")) {
    return { titleKey: "recGov", bodyKey: "recGovBody" };
  }
  if (form.timeline === "90" && form.needType !== "mandata") return { titleKey: "recRace", bodyKey: "recRaceBody" };
  if (form.needType === "advisory") return { titleKey: "recAdv", bodyKey: "recAdvBody" };
  if (form.needType === "mandata") return { titleKey: "recPlat", bodyKey: "recPlatBody" };
  return { titleKey: "recBoth", bodyKey: "recBothBody" };
}
