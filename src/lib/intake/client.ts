import { PUBLIC_WHATSAPP_MESSAGE, PUBLIC_WHATSAPP_NUMBER } from "./public";

export type PublicConfig = {
  turnstileSiteKey: string | null;
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappAutomation: boolean;
};

const FALLBACK: PublicConfig = {
  turnstileSiteKey: null,
  whatsappNumber: PUBLIC_WHATSAPP_NUMBER,
  whatsappMessage: PUBLIC_WHATSAPP_MESSAGE,
  whatsappAutomation: false,
};

let cache: PublicConfig | null = null;

export function defaultPublicConfig(): PublicConfig {
  return { ...FALLBACK };
}

export async function loadPublicConfig(): Promise<PublicConfig> {
  if (cache) return cache;
  try {
    const res = await fetch("/api/public-config", { headers: { accept: "application/json" } });
    const data = (await res.json()) as Partial<PublicConfig> & { ok?: boolean };
    cache = {
      turnstileSiteKey: data.turnstileSiteKey ?? null,
      whatsappNumber: (data.whatsappNumber || PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, "") || PUBLIC_WHATSAPP_NUMBER,
      whatsappMessage: data.whatsappMessage || PUBLIC_WHATSAPP_MESSAGE,
      whatsappAutomation: Boolean(data.whatsappAutomation),
    };
  } catch {
    cache = { ...FALLBACK };
  }
  return cache;
}

export function whatsappHref(number: string, message: string) {
  const digits = number.replace(/\D/g, "") || PUBLIC_WHATSAPP_NUMBER;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message || PUBLIC_WHATSAPP_MESSAGE)}`;
}
