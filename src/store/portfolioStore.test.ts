import { beforeEach, describe, expect, it } from 'vitest';
import { portefeuillesDemo } from '../data/demo';
import { usePortefeuilles } from './portfolioStore';

beforeEach(() => {
  usePortefeuilles.setState({ portefeuilles: portefeuillesDemo(), alerteChargement: null });
});

const etat = () => usePortefeuilles.getState();

describe('store des portefeuilles', () => {
  it('charge les trois portefeuilles de démonstration', () => {
    expect(etat().portefeuilles.map((p) => p.nom)).toEqual(['Banque Lumen', 'Ardoise Bâtiment', 'Ville de Port-Aurèle']);
  });

  it('crée, duplique et supprime un portefeuille', () => {
    const id = etat().creerPortefeuille('Mutuelle Horizon');
    expect(etat().portefeuilles.find((p) => p.id === id)?.organisation.fictive).toBe(false);
    const copie = etat().dupliquerPortefeuille('demo-banque-lumen');
    expect(etat().portefeuilles.find((p) => p.id === copie)?.cas).toHaveLength(6);
    etat().supprimerPortefeuille(id);
    expect(etat().portefeuilles.some((p) => p.id === id)).toBe(false);
  });

  it('ajoute un cas avec le prochain code de nomenclature', () => {
    const casId = etat().ajouterCas('demo-ardoise-batiment', { titre: 'Suivi des déchets de chantier' });
    const cas = etat().portefeuilles[1]?.cas.find((c) => c.id === casId);
    expect(cas?.code).toBe('UC-AB-006');
  });

  it('retire un cas supprimé des dépendances des autres cas', () => {
    etat().supprimerCas('demo-banque-lumen', 'demo-bl-001');
    const bl = etat().portefeuilles[0];
    expect(bl?.cas).toHaveLength(5);
    expect(bl?.cas.every((c) => !c.dependances.cas.includes('demo-bl-001'))).toBe(true);
  });

  it('modifie un cas de façon immuable', () => {
    const avant = etat().portefeuilles[0];
    etat().majCas('demo-banque-lumen', 'demo-bl-002', (c) => {
      c.scores.urgence = 5;
    });
    const apres = etat().portefeuilles[0];
    expect(apres).not.toBe(avant);
    expect(apres?.cas[1]?.scores.urgence).toBe(5);
    expect(avant?.cas[1]?.scores.urgence).toBe(2);
  });

  it('importe sans collision d’identifiants et réinitialise la démonstration', () => {
    const [ids] = [etat().importerPortefeuilles([portefeuillesDemo()[0]!])];
    expect(ids[0]).not.toBe('demo-banque-lumen');
    etat().majCas('demo-banque-lumen', 'demo-bl-001', (c) => {
      c.titre = 'Modifié';
    });
    etat().reinitialiserDemo();
    expect(etat().portefeuilles[0]?.cas[0]?.titre).toBe('Contrôle automatique de complétude des dossiers à la soumission');
    expect(etat().portefeuilles).toHaveLength(4);
  });
});
