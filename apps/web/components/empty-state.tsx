import { ReactNode } from "react";

/** Reusable minimal empty state — icon, short message, optional action.
 *  No large illustrations, keeps the app fast. */
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="qb-empty-state">
      <span className="qb-empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="qb-empty-state-title">{title}</div>
      {description && <p className="qb-empty-state-description">{description}</p>}
      {action}
    </div>
  );
}
