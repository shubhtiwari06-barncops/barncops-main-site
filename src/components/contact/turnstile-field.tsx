import { useEffect, useRef } from "react";

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
};

export function TurnstileField({ siteKey, onToken }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let widgetId: string | undefined;

    function render() {
      const api = window.turnstile;
      if (!api || !el || cancelled) return;
      widgetId = api.render(el, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (existing) {
        existing.addEventListener("load", render, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.turnstile = "1";
        script.addEventListener("load", render, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  return <div ref={host} className="mt-4" />;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme: "dark" | "light" | "auto";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove?: (id: string) => void;
    };
  }
}
