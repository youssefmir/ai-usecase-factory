/** Marque : quatre cases de nomenclature, dont une en jaune signal et une pastille d'obligation. */
export function Logo({ taille = 28 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={taille} height={taille} aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="3" fill="#15171A" />
      <rect x="5" y="5" width="10" height="10" fill="#F2B800" />
      <rect x="17.75" y="5.75" width="8.5" height="8.5" fill="none" stroke="#ECEDEA" strokeWidth="1.5" />
      <rect x="5.75" y="17.75" width="8.5" height="8.5" fill="none" stroke="#ECEDEA" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="4.6" fill="#005387" stroke="#ECEDEA" strokeWidth="1.5" />
    </svg>
  );
}
