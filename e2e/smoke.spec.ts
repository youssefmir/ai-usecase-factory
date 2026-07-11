import { expect, test, type Page } from '@playwright/test';

/** Échoue si la page émet une erreur JavaScript ou une erreur de console. */
function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text());
  });
  return erreurs;
}

test.describe('parcours principal', () => {
  test('la vitrine présente le produit et ses vrais composants', async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1, name: /AI Use Case\s*Factory/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /passent par les cinq postes/ })).toBeVisible();
    await expect(page.getByText('Ligne de montage · Banque Lumen')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Verdict de la qualification AI Act' })).toContainText('Haut risque');
    await expect(page.getByText('Projet réalisé par')).toBeVisible();
    expect(erreurs).toEqual([]);
  });

  test('l’atelier liste les trois portefeuilles fictifs', async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto('./#/atelier');
    for (const nom of ['Banque Lumen', 'Ardoise Bâtiment', 'Ville de Port-Aurèle']) {
      await expect(page.getByRole('heading', { name: nom })).toBeVisible();
    }
    await expect(page.getByText('Fictif', { exact: true }).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });

  test('du tableau de bord à la fiche, puis à chaque onglet', async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto('./#/atelier/demo-banque-lumen');
    const table = page.getByRole('table', { name: /Cas d’usage du portefeuille/ });
    await expect(table.locator('tbody tr')).toHaveCount(6);
    await table.getByRole('link', { name: 'Assistant de pré-analyse pour la validation des demandes' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Assistant de pré-analyse/ })).toBeVisible();

    await page.getByRole('tab', { name: /AI Act/ }).click();
    await expect(page.getByRole('region', { name: 'Verdict de la qualification AI Act' })).toContainText('Haut risque');
    await expect(page.getByText('FRIA requise').first()).toBeVisible();

    await page.getByRole('tab', { name: /RGPD/ }).click();
    await expect(page.getByRole('region', { name: 'Résultat de la pré-analyse RGPD' })).toContainText('AIPD probablement requise');

    await page.getByRole('tab', { name: /Scoring/ }).click();
    await expect(page.getByText('Score de priorité')).toBeVisible();

    await page.getByRole('tab', { name: /Business case/ }).click();
    await expect(page.getByRole('img', { name: 'Graphique des flux de trésorerie annuels et cumulés' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Diagramme en tornade de la sensibilité de la VAN' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Histogramme de la VAN simulée' })).toBeVisible();
    expect(erreurs).toEqual([]);
  });

  test('la matrice place les cas et ouvre une fiche au clic', async ({ page }) => {
    await page.goto('./#/atelier/demo-banque-lumen/matrice');
    const matrice = page.getByRole('group', { name: /Matrice valeur × faisabilité/ });
    await expect(matrice.getByRole('button')).toHaveCount(6);
    await matrice.getByRole('button', { name: /UC-BL-001/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Contrôle automatique de complétude/ })).toBeVisible();
  });

  test('la roadmap propose trois vagues et une frise', async ({ page }) => {
    await page.goto('./#/atelier/demo-port-aurele/roadmap');
    await expect(page.getByRole('heading', { name: 'Roadmap en trois vagues' })).toBeVisible();
    await expect(page.getByText('Frise chronologique')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Vague 1' }).getByRole('listitem')).toHaveCount(3);
  });

  test('la note de cadrage s’exporte en Markdown', async ({ page }) => {
    await page.goto('./#/atelier/demo-banque-lumen/cas/demo-bl-004/note');
    await expect(page.getByText('UC-BL-004').first()).toBeVisible();
    const telechargement = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter en Markdown' }).click();
    const fichier = await telechargement;
    expect(fichier.suggestedFilename()).toMatch(/^note-cadrage-uc-bl-004-\d{4}-\d{2}-\d{2}\.md$/);
  });

  test('la méthode et le thème sombre', async ({ page }) => {
    await page.goto('./#/methode');
    await expect(page.getByRole('heading', { level: 1, name: 'Méthode' })).toBeVisible();
    await page.getByRole('button', { name: /Thème sombre/ }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('les modifications sont conservées après rechargement', async ({ page }) => {
    await page.goto('./#/atelier/demo-ardoise-batiment/cas/demo-ab-001/fiche');
    const titre = page.getByLabel(/Intitulé du cas d’usage/);
    await titre.fill('Veille des appels d’offres (modifiée)');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Veille des appels d’offres (modifiée)' })).toBeVisible();
  });
});
