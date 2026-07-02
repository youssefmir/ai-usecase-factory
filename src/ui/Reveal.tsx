import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { DUREES, transition, useMouvementReduit } from './motion';

interface RevealProps {
  children: ReactNode;
  /** Rang dans la séquence d'entrée (décalage de 60 ms par rang). */
  rang?: number;
  /** Apparition au défilement (une seule fois) plutôt qu'au montage. */
  auDefilement?: boolean;
  decalage?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'header' | 'article';
}

/** Révélation décalée : légère translation verticale et fondu, sans saut de mise en page. */
export function Reveal({ children, rang = 0, auDefilement = false, decalage = 10, className, as = 'div' }: RevealProps) {
  const reduit = useMouvementReduit();
  const Composant = motion[as];
  if (reduit) return <Composant className={className}>{children}</Composant>;
  const cible = { opacity: 1, y: 0 };
  return (
    <Composant
      className={className}
      initial={{ opacity: 0, y: decalage }}
      {...(auDefilement ? { whileInView: cible, viewport: { once: true, margin: '0px 0px -12% 0px' } } : { animate: cible })}
      transition={transition(DUREES.lent, rang * 0.06)}
    >
      {children}
    </Composant>
  );
}
