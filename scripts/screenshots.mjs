/**
 * Captures d'écran de la documentation (docs/img), prises sur le site construit.
 * Usage : npm run screenshots   (construit le site, lance la prévisualisation, capture, puis l'arrête)
 *
 * Les animations sont rendues dans leur état final (prefers-reduced-motion: reduce).
 */
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { setTimeout as attendre } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const racine = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.SCREENSHOTS_PORT ?? 4318);
const base = `http://localhost:${port}/ai-usecase-factory/`;
const dossier = new URL('../docs/img/', import.meta.url);

/** route, nom de fichier, options (thème, taille, élément à amener en haut de l'écran). */
const CAPTURES = [
  { route: '', fichier: 'vitrine.png' },
  { route: '', fichier: 'vitrine-sombre.png', theme: 'dark' },
  { route: 'atelier', fichier: 'portefeuilles.png' },
  { route: 'atelier/demo-banque-lumen', fichier: 'tableau-de-bord.png' },
  { route: 'atelier/demo-banque-lumen', fichier: 'tableau-de-bord-sombre.png', theme: 'dark' },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-001/fiche', fichier: 'fiche.png' },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-003/ai-act', fichier: 'ai-act.png', cible: '[role="tablist"]' },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-004/business-case', fichier: 'business-case.png', cible: '[role="tablist"]' },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-004/business-case', fichier: 'monte-carlo.png', cible: 'figure:has(svg[aria-label="Histogramme de la VAN simulée"])' },
  { route: 'atelier/demo-banque-lumen/matrice', fichier: 'matrice.png', cible: 'h1' },
  { route: 'atelier/demo-port-aurele/roadmap', fichier: 'roadmap.png', cible: 'h1' },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-004/note', fichier: 'note-cadrage.png' },
  { route: '', fichier: 'mobile.png', largeur: 390, hauteur: 844 },
  { route: 'atelier/demo-banque-lumen/cas/demo-bl-003/ai-act', fichier: 'mobile-ai-act.png', largeur: 390, hauteur: 844, cible: 'section[aria-label="Verdict de la qualification AI Act"]' },
];

async function attendreServeur() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(base);
      if (r.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await attendre(500);
  }
  throw new Error(`Le serveur de prévisualisation ne répond pas sur ${base}`);
}

const serveur = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  cwd: racine,
  stdio: 'ignore',
  detached: true,
});

try {
  await attendreServeur();
  await mkdir(dossier, { recursive: true });
  const navigateur = await chromium.launch();
  for (const c of CAPTURES) {
    const contexte = await navigateur.newContext({
      viewport: { width: c.largeur ?? 1440, height: c.hauteur ?? 900 },
      colorScheme: c.theme === 'dark' ? 'dark' : 'light',
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    });
    const page = await contexte.newPage();
    await page.goto(`${base}#/${c.route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (c.cible) {
      await page.locator(c.cible).first().evaluate((el) => {
        const haut = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo(0, Math.max(0, haut));
      });
    }
    await page.waitForTimeout(400);
    const chemin = fileURLToPath(new URL(c.fichier, dossier));
    await page.screenshot({ path: chemin });
    const { size } = await stat(chemin);
    console.log(`${c.fichier.padEnd(28)} ${(size / 1024).toFixed(0).padStart(4)} Ko`);
    await contexte.close();
  }
  await navigateur.close();
} finally {
  try {
    process.kill(-serveur.pid, 'SIGTERM');
  } catch {
    serveur.kill('SIGTERM');
  }
}
