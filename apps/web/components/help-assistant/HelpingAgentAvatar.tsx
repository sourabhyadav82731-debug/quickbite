// Abstract glowing "AI helper orb" — deliberately not a face (human or robot),
// per the design brief. Pure CSS (gradient + layered shadows + a couple of
// small particles), no image/SVG asset and no animation library.
export function HelpingAgentAvatar({
  size = "md",
  thinking = false,
}: {
  size?: "sm" | "md" | "lg";
  thinking?: boolean;
}) {
  return (
    <span
      className={`qb-orb qb-orb-${size}${thinking ? " qb-orb-thinking" : ""}`}
      role="img"
      aria-hidden="true"
    >
      <span className="qb-orb-ring" />
      <span className="qb-orb-core" />
      <span className="qb-orb-particle qb-orb-particle-1" />
      <span className="qb-orb-particle qb-orb-particle-2" />
    </span>
  );
}
