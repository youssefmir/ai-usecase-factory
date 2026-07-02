/**
 * Affiche la synthèse calculée des portefeuilles de démonstration (Markdown).
 * Les chiffres cités dans le README proviennent de cette commande : npm run demo:summary
 */
import { createServer } from 'vite';

const serveur = await createServer({
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});

try {
  const { portefeuillesDemo } = await serveur.ssrLoadModule('/src/data/demo/index.ts');
  const { analyserPortefeuille } = await serveur.ssrLoadModule('/src/domain/analysis.ts');
  const { simulerMonteCarlo } = await serveur.ssrLoadModule('/src/domain/businessCase/uncertainty.ts');
  const { NIVEAUX_AI_ACT } = await serveur.ssrLoadModule('/src/domain/aiAct/qualification.ts');
  const { NIVEAUX_RGPD } = await serveur.ssrLoadModule('/src/domain/rgpd/evaluation.ts');
  const { libelleQuadrant } = await serveur.ssrLoadModule('/src/domain/scoring/criteria.ts');
  const { libelleVague } = await serveur.ssrLoadModule('/src/domain/roadmap/roadmap.ts');
  const { fmtEuroCompact, fmtNombre, fmtPct } = await serveur.ssrLoadModule('/src/domain/format.ts');

  const reference = process.argv[2] ?? '2026-11-01';
  console.log(`# Synthèse des portefeuilles de démonstration (référence ${reference})\n`);
  console.log('Valeurs calculées par l’application à partir d’hypothèses fictives.\n');

  for (const p of portefeuillesDemo()) {
    const a = analyserPortefeuille(p, reference);
    const s = a.synthese;
    console.log(`## ${p.nom}\n`);
    const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
    console.log(
      `${s.nbCas} cas · ${pluriel(s.nbQuickWins, 'quick win')} · ${s.nbHautRisque} à haut risque · ${s.nbAipd} AIPD ${
        s.nbAipd > 1 ? 'probables' : 'probable'
      } · VAN cumulée ${fmtEuroCompact(s.vanTotale)}\n`,
    );
    console.log('| Code | Cas d’usage | Valeur | Faisab. | Risque | Priorité | Quadrant | AI Act | RGPD | VAN 3 ans | P(VAN>0) | Vague |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const c of a.cas) {
      const mc = simulerMonteCarlo(c.cas.businessCase);
      const vague = a.roadmap.entrees.find((e) => e.casId === c.cas.id)?.vague ?? 0;
      console.log(
        `| ${c.cas.code} | ${c.cas.titre} | ${fmtNombre(c.scoring.valeur.note, 2)} | ${fmtNombre(c.scoring.faisabilite.note, 2)} | ${fmtNombre(
          c.scoring.risque.note,
          2,
        )} | ${fmtNombre(c.scoring.priorite, 1)} | ${libelleQuadrant(c.scoring.quadrant)} | ${NIVEAUX_AI_ACT[c.aiAct.niveau].court} | ${
          NIVEAUX_RGPD[c.rgpd.niveau].court
        } | ${fmtEuroCompact(c.businessCase.van)} | ${fmtPct(mc.probaVanPositive)} | ${libelleVague(vague)} |`,
      );
    }
    console.log('');
  }
} finally {
  await serveur.close();
}
