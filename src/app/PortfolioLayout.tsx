import { NavLink, Outlet, useParams } from 'react-router';
import { usePortefeuille } from '../store/portfolioStore';
import { TagFictif } from '../ui/bits';
import { ButtonLink } from '../ui/Button';

const SOUS_NAVIGATION = [
  { vers: '', libelle: 'Tableau de bord', fin: true },
  { vers: 'matrice', libelle: 'Matrice', fin: false },
  { vers: 'roadmap', libelle: 'Roadmap', fin: false },
  { vers: 'parametres', libelle: 'Paramètres', fin: false },
  { vers: 'assistant', libelle: 'Assistant', fin: false },
];

export function PortfolioLayout() {
  const { pid } = useParams();
  const portefeuille = usePortefeuille(pid);

  if (!portefeuille) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6">
        <p className="label-caps">Erreur 404</p>
        <h1 className="mt-2 text-3xl font-semibold">Portefeuille introuvable</h1>
        <p className="mt-2 text-muted">Il a peut-être été supprimé de ce navigateur.</p>
        <ButtonLink to="/atelier" variante="primaire" className="mt-6">
          Retour aux portefeuilles
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <div className="no-print border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-1 px-4 md:flex-row md:items-center md:gap-6 md:px-6">
          <div className="flex min-w-0 items-center gap-2 pt-2 md:pt-0">
            <span className="label-caps">Portefeuille</span>
            <span className="truncate font-display text-[14px] font-semibold text-ink">{portefeuille.nom}</span>
            {portefeuille.organisation.fictive && <TagFictif />}
          </div>
          <nav aria-label="Navigation du portefeuille" className="-mx-1 flex overflow-x-auto">
            {SOUS_NAVIGATION.map((l) => (
              <NavLink
                key={l.vers}
                to={l.vers ? `/atelier/${portefeuille.id}/${l.vers}` : `/atelier/${portefeuille.id}`}
                end={l.fin}
                className={({ isActive }) =>
                  `relative flex min-h-11 shrink-0 items-center px-3 font-display text-[12.5px] font-semibold tracking-[0.08em] uppercase ${
                    isActive ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-ink' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {l.libelle}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <Outlet context={portefeuille} />
    </>
  );
}
