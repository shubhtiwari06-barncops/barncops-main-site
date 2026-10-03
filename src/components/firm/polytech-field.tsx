/** Quiet 1px grid only. No charts, contours, or organic shapes. */
export function PolyTechField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-5"
      style={{
        backgroundImage:
          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  );
}
