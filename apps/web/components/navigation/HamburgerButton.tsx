"use client";

/** Premium 3-line hamburger that morphs into an X via pure CSS transforms —
 *  no icon library needed. */
export function HamburgerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className={`qbnav-hamburger${open ? " qbnav-hamburger-open" : ""}`}
    >
      <span className="qbnav-hamburger-bar" />
      <span className="qbnav-hamburger-bar" />
      <span className="qbnav-hamburger-bar" />
    </button>
  );
}
