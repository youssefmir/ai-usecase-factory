/**
 * Calendrier d'application de l'AI Act, à jour au 1er novembre 2026 (règlement (UE) 2024/1689
 * modifié par le règlement omnibus (UE) 2026/1744). Sources : docs/qualification-ai-act.md.
 */

export type PorteeJalon =
  | 'general'
  | 'interdictions'
  | 'interdictions_omnibus'
  | 'maitrise'
  | 'gpai'
  | 'transparence'
  | 'marquage_transitoire'
  | 'haut_risque_annexe_III'
  | 'haut_risque_annexe_I'
  | 'autorites_publiques';

export interface Jalon {
  id: string;
  date: string;
  titre: string;
  detail: string;
  portees: PorteeJalon[];
  /** Mention de prudence lorsque la source est une synthèse secondaire. */
  prudence?: string;
}

export const JALONS: readonly Jalon[] = [
  {
    id: 'entree_vigueur',
    date: '2024-08-01',
    titre: 'Entrée en vigueur de l’AI Act',
    detail: 'Règlement (UE) 2024/1689 publié au JO le 12 juillet 2024 ; application échelonnée.',
    portees: ['general'],
  },
  {
    id: 'interdictions',
    date: '2025-02-02',
    titre: 'Pratiques interdites et maîtrise de l’IA',
    detail: 'Application des chapitres I et II : interdictions de l’art. 5 et obligation de maîtrise de l’IA (art. 4).',
    portees: ['interdictions', 'maitrise'],
  },
  {
    id: 'gpai',
    date: '2025-08-02',
    titre: 'Modèles d’IA à usage général',
    detail:
      'Obligations des fournisseurs de modèles à usage général (chapitre V), gouvernance et régime de sanctions.',
    portees: ['gpai'],
  },
  {
    id: 'omnibus',
    date: '2026-07-27',
    titre: 'Entrée en vigueur de l’omnibus numérique sur l’IA',
    detail:
      'Règlement (UE) 2026/1744, publié au JO le 24 juillet 2026 : report des obligations haut risque, nouvelles interdictions, art. 4 recalibré.',
    portees: ['general'],
  },
  {
    id: 'application_generale',
    date: '2026-08-02',
    titre: 'Application générale, dont la transparence (art. 50)',
    detail: 'La majorité du règlement s’applique, notamment les obligations de transparence de l’art. 50.',
    portees: ['general', 'transparence'],
  },
  {
    id: 'interdictions_omnibus',
    date: '2026-12-02',
    titre: 'Nouvelles interdictions de l’omnibus',
    detail:
      'Interdiction des systèmes de « nudification » (images intimes non consenties) et des contenus pédocriminels générés par IA.',
    portees: ['interdictions_omnibus'],
  },
  {
    id: 'marquage_transitoire',
    date: '2026-12-02',
    titre: 'Fin du délai de marquage pour les systèmes existants',
    detail:
      'Marquage des contenus synthétiques (art. 50(2)) exigible pour les systèmes génératifs mis sur le marché avant le 2 août 2026.',
    portees: ['marquage_transitoire'],
    prudence: 'Délai transitoire décrit par les synthèses consultées : à confirmer dans le texte consolidé.',
  },
  {
    id: 'gpai_existants',
    date: '2027-08-02',
    titre: 'Modèles à usage général déjà sur le marché',
    detail: 'Mise en conformité des modèles à usage général mis sur le marché avant le 2 août 2025 (art. 111(3)).',
    portees: ['gpai'],
  },
  {
    id: 'haut_risque_annexe_III',
    date: '2027-12-02',
    titre: 'Haut risque : systèmes de l’annexe III',
    detail: 'Obligations des systèmes à haut risque autonomes (annexe III), reportées par l’omnibus (initialement 2 août 2026).',
    portees: ['haut_risque_annexe_III'],
  },
  {
    id: 'haut_risque_annexe_I',
    date: '2028-08-02',
    titre: 'Haut risque : produits de l’annexe I',
    detail:
      'Obligations des systèmes intégrés à des produits réglementés (annexe I), reportées par l’omnibus (initialement 2 août 2027).',
    portees: ['haut_risque_annexe_I'],
  },
  {
    id: 'autorites_publiques',
    date: '2030-08-02',
    titre: 'Systèmes à haut risque des autorités publiques déjà en service',
    detail:
      'Échéance de mise en conformité des systèmes à haut risque destinés aux autorités publiques et mis en service avant la date d’application (art. 111(2)).',
    portees: ['autorites_publiques'],
    prudence: 'Échéance du texte initial ; son articulation avec les nouvelles dates de l’omnibus est à vérifier.',
  },
];

export type StatutJalon = 'en_vigueur' | 'a_venir';

export interface JalonDate extends Jalon {
  statut: StatutJalon;
  /** Nombre de jours restants (négatif si la date est passée). */
  joursRestants: number;
}

/** Date de référence au format ISO (AAAA-MM-JJ) en heure locale. */
export function dateDuJour(date = new Date()): string {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const j = String(date.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

function isoVersUtc(iso: string): number {
  const [annee = 1970, mois = 1, jour = 1] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(annee, mois - 1, jour);
}

export function joursEntre(debutIso: string, finIso: string): number {
  return Math.round((isoVersUtc(finIso) - isoVersUtc(debutIso)) / 86_400_000);
}

export function daterJalon(jalon: Jalon, reference: string): JalonDate {
  const joursRestants = joursEntre(reference, jalon.date);
  return { ...jalon, statut: joursRestants <= 0 ? 'en_vigueur' : 'a_venir', joursRestants };
}

export function jalonsPourPortees(portees: readonly PorteeJalon[], reference: string): JalonDate[] {
  const voulues = new Set(portees);
  return JALONS.filter((j) => j.portees.some((p) => voulues.has(p)))
    .map((j) => daterJalon(j, reference))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function trouverJalon(id: string): Jalon {
  const jalon = JALONS.find((j) => j.id === id);
  if (!jalon) throw new Error(`Jalon inconnu : ${id}`);
  return jalon;
}
