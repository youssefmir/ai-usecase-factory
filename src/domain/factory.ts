import {
  PortfolioSchema,
  UseCaseSchema,
  type Portfolio,
  type PortfolioInput,
  type UseCase,
  type UseCaseInput,
} from './model';

/** Identifiant unique (crypto.randomUUID si disponible, sinon repli pseudo-aléatoire). */
export function nouvelId(prefixe = ''): string {
  const c = globalThis.crypto as Crypto | undefined;
  const brut =
    c && typeof c.randomUUID === 'function'
      ? c.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefixe ? `${prefixe}-${brut}` : brut;
}

/** Crée un cas d'usage complet à partir de champs partiels (les valeurs par défaut viennent du schéma). */
export function creerCasUsage(partiel: Partial<UseCaseInput> & { titre: string }): UseCase {
  return UseCaseSchema.parse({ id: nouvelId('cas'), ...partiel });
}

/** Crée un portefeuille complet à partir de champs partiels. */
export function creerPortefeuille(partiel: Partial<PortfolioInput> & { nom: string }): Portfolio {
  return PortfolioSchema.parse({ id: nouvelId('pf'), ...partiel });
}

/** Prochain code de nomenclature libre (« UC-BL-007 ») dans un portefeuille. */
export function prochainCode(portefeuille: Portfolio, prefixe: string): string {
  const numeros = portefeuille.cas
    .filter((c) => c.code.startsWith(`${prefixe}-`))
    .map((c) => /-(\d+)$/.exec(c.code)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);
  const suivant = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `${prefixe}-${String(suivant).padStart(3, '0')}`;
}

/** Préfixe de code dérivé du nom de l'organisation (« Banque Lumen » -> « BL »). */
export function prefixeCode(nom: string): string {
  const initiales = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s\-']+/)
    .filter((mot) => mot.length > 2 || /^[A-Z]/.test(mot))
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3);
  return initiales || 'UC';
}

/**
 * Copie profonde d'un portefeuille avec de nouveaux identifiants
 * (les dépendances entre cas sont réécrites vers les nouveaux identifiants).
 */
export function dupliquerPortefeuille(source: Portfolio, nom?: string): Portfolio {
  const correspondance = new Map<string, string>();
  for (const cas of source.cas) correspondance.set(cas.id, nouvelId('cas'));
  const maintenant = new Date().toISOString();
  const copie: Portfolio = structuredClone(source);
  copie.id = nouvelId('pf');
  copie.nom = nom ?? `${source.nom} (copie)`;
  copie.demo = false;
  copie.creeLe = maintenant;
  copie.modifieLe = maintenant;
  copie.cas = copie.cas.map((cas) => ({
    ...cas,
    id: correspondance.get(cas.id) ?? nouvelId('cas'),
    dependances: {
      ...cas.dependances,
      cas: cas.dependances.cas.map((dep) => correspondance.get(dep)).filter((d): d is string => Boolean(d)),
    },
  }));
  return copie;
}

/** Copie d'un cas d'usage dans le même portefeuille. */
export function dupliquerCasUsage(source: UseCase, code: string): UseCase {
  const maintenant = new Date().toISOString();
  const copie: UseCase = structuredClone(source);
  copie.id = nouvelId('cas');
  copie.code = code;
  copie.titre = `${source.titre} (copie)`;
  copie.statut = 'idee';
  copie.roadmap = { ...copie.roadmap, vagueManuelle: null };
  copie.creeLe = maintenant;
  copie.modifieLe = maintenant;
  return copie;
}
