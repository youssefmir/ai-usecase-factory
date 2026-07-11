import { expect, test } from '@playwright/test';

const VUES = [
  '',
  'atelier',
  'atelier/demo-banque-lumen',
  'atelier/demo-banque-lumen/cas/demo-bl-003/fiche',
  'atelier/demo-banque-lumen/cas/demo-bl-003/scoring',
  'atelier/demo-banque-lumen/cas/demo-bl-003/ai-act',
  'atelier/demo-banque-lumen/cas/demo-bl-003/rgpd',
  'atelier/demo-banque-lumen/cas/demo-bl-004/business-case',
  'atelier/demo-banque-lumen/matrice',
  'atelier/demo-port-aurele/roadmap',
  'atelier/demo-banque-lumen/parametres',
  'atelier/demo-banque-lumen/assistant',
  'atelier/demo-banque-lumen/cas/demo-bl-004/note',
  'methode',
];

test.describe('qualité transverse', () => {
  test('aucun défilement horizontal à 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const vue of VUES) {
      await page.goto(`./#/${vue}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(250);
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(scroll, `vue « ${vue || 'vitrine'} »`).toBeLessThanOrEqual(client);
    }
  });

  test('aucune ressource externe au chargement (fonctionne hors ligne)', async ({ page, baseURL }) => {
    const hote = new URL(baseURL ?? 'http://localhost').host;
    const externes: string[] = [];
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.host !== hote) {
        externes.push(url.href);
        return route.abort();
      }
      return route.continue();
    });
    for (const vue of ['', 'atelier/demo-banque-lumen', 'atelier/demo-banque-lumen/cas/demo-bl-004/business-case']) {
      await page.goto(`./#/${vue}`);
      await page.waitForLoadState('networkidle');
    }
    expect(externes).toEqual([]);
  });

  test('navigation au clavier : onglets, matrice et boîte de dialogue', async ({ page }) => {
    await page.goto('./#/atelier/demo-banque-lumen/cas/demo-bl-003/fiche');
    await page.getByRole('tab', { name: /Fiche/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Scoring/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: /Scoring/ })).toBeFocused();

    await page.goto('./#/atelier/demo-banque-lumen/matrice');
    const point = page.getByRole('button', { name: /UC-BL-002/ });
    await point.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: /Priorisation des relances/ })).toBeVisible();

    await page.goto('./#/atelier');
    await page.getByRole('button', { name: 'Nouveau' }).click();
    const dialogue = page.getByRole('dialog', { name: 'Nouveau portefeuille' });
    await expect(dialogue).toBeVisible();
    await expect(dialogue.getByLabel(/Nom de l’organisation/)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialogue).toBeHidden();
  });
});
