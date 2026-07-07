import type { ReactNode } from 'react';

/** Infobulle positionnée dans le repère du graphique (le contenu est rendu par React, donc échappé). */
export function Infobulle({ x, y, largeurConteneur, children }: { x: number; y: number; largeurConteneur: number; children: ReactNode }) {
  const aDroite = x < largeurConteneur * 0.6;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 max-w-[260px] rounded-[2px] border border-ink/70 bg-surface px-3 py-2 text-[12.5px] shadow-[0_2px_0_rgb(21_23_26/0.08)]"
      style={{
        left: aDroite ? x + 12 : undefined,
        right: aDroite ? undefined : largeurConteneur - x + 12,
        top: Math.max(0, y - 12),
      }}
    >
      {children}
    </div>
  );
}
