import { useTitre } from '../app/useTitre';
import { ButtonLink } from '../ui/Button';

export default function IntrouvablePage() {
  useTitre('Page introuvable');
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-20 md:px-6">
      <p className="mono text-[13px] text-muted">ERREUR 404</p>
      <h1 className="mt-2 text-4xl font-semibold">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-xl text-muted">Le lien est peut-être incomplet. Revenez à l’atelier pour retrouver vos portefeuilles.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink to="/atelier" variante="primaire">
          Ouvrir l’atelier
        </ButtonLink>
        <ButtonLink to="/">Vitrine</ButtonLink>
      </div>
    </div>
  );
}
