/** Reusable shimmer placeholder — dark purple-gray, respects
 *  prefers-reduced-motion (handled entirely in the .qb-skeleton CSS). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`qb-skeleton ${className}`} aria-hidden="true" />;
}
