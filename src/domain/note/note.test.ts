import { describe, expect, it } from 'vitest';
import { portefeuillesDemo } from '../../data/demo';
import { analyserPortefeuille } from '../analysis';
import { construireNote, noteVersMarkdown, prochainesEtapes } from './note';

const [banque] = portefeuillesDemo();
const analyse = analyserPortefeuille(banque!, '2026-11-01');
const casScore = analyse.cas.find((c) => c.cas.code === 'UC-BL-004')!;
const entree = analyse.roadmap.entrees.find((e) => e.code === 'UC-BL-004');

describe('note de cadrage', () => {
  const note = construireNote(casScore, banque!, entree, '2026-11-02T10:00:00Z');

  it('structure la note en 12 sections numérotées avec un cartouche', () => {
    expect(note.sections.map((s) => s.numero)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    expect(note.cartouche.find((c) => c.terme === 'Organisation')?.definition).toBe('Banque Lumen (fictive)');
    expect(note.mentions[0]).toMatch(/fictive/);
    expect(note.mentions.join(' ')).toMatch(/ne constitue pas un avis juridique/);
  });

  it('exporte un Markdown complet et lisible', () => {
    const md = noteVersMarkdown(note);
    expect(md.startsWith('# Note de cadrage — UC-BL-004 Score d’aide à l’octroi')).toBe(true);
    expect(md).toContain('## 8. Qualification AI Act');
    expect(md).toContain('Haut risque · annexe III, 5 b)');
    expect(md).toContain('| Critère | Note | Niveau retenu | Justification |');
    expect(md).toContain('Probabilité que la VAN soit positive');
    expect(md).toContain('Réaliser l’analyse d’impact sur les droits fondamentaux');
    // Les barres verticales des cellules sont échappées.
    expect(md.split('\n').filter((l) => l.startsWith('|')).every((l) => l.trim().endsWith('|'))).toBe(true);
  });

  it('propose des décisions adaptées au cas', () => {
    const etapes = prochainesEtapes(casScore, entree);
    expect(etapes.some((e) => e.includes('FRIA'))).toBe(true);
    expect(etapes.some((e) => e.includes('AIPD'))).toBe(true);
    expect(etapes.at(-1)).toMatch(/comité.*vague 3/);
    const planning = analyse.cas.find((c) => c.cas.code === 'UC-BL-002')!;
    expect(prochainesEtapes(planning).some((e) => e.includes('FRIA'))).toBe(false);
  });
});
