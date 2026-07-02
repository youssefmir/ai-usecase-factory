import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { classesBouton, type Taille, type Variante } from './buttonClasses';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  icone?: ReactNode;
}

export function Button({ variante = 'secondaire', taille = 'md', icone, className = '', children, type = 'button', ...reste }: ButtonProps) {
  return (
    <button type={type} className={classesBouton(variante, taille, className)} {...reste}>
      {icone}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variante?: Variante;
  taille?: Taille;
  icone?: ReactNode;
}

export function ButtonLink({ variante = 'secondaire', taille = 'md', icone, className = '', children, ...reste }: ButtonLinkProps) {
  return (
    <Link className={classesBouton(variante, taille, className)} {...reste}>
      {icone}
      {children}
    </Link>
  );
}
