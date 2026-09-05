"use client";

import { ReactNode, RefObject } from "react";

export function HelpingAgentPanel({
  visible,
  minimized,
  rtl,
  lifted,
  ariaLabel,
  panelRef,
  children,
}: {
  visible: boolean;
  minimized: boolean;
  rtl: boolean;
  lifted: boolean;
  ariaLabel: string;
  panelRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      dir={rtl ? "rtl" : "ltr"}
      className={[
        "qb-panel",
        visible ? "qb-panel-visible" : "",
        minimized ? "qb-panel-minimized" : "",
        lifted ? "qb-panel-lifted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
