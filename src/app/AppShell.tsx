import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ExternalLink, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../store/themeStore';
import { abonnerEtatStockage, persistanceAssuree } from '../store/storage';
import { usePortefeuilles } from '../store/portfolioStore';
import { Avis } from '../ui/bits';
import { Logo } from '../ui/Logo';

export const LIEN_GITHUB = 'https://github.com/youssefmir';
export const LIEN_DEPOT = 'https://github.com/youssefmir/ai-usecase-factory';

const LIENS = [
  { vers: '/', libelle: 'Vitrine', fin: true },
  { vers: '/atelier', libelle: 'Atelier', fin: false },
  { vers: '/methode', libelle: 'Méthode', fin: false },
];

function BasculeTheme() {
  const { sombre, basculer } = useTheme();
  useEffect(() => {
    let media: MediaQueryList | null = null;
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    const f = () => useTheme.getState().synchroniserSysteme();
    media.addEventListener('change', f);
    return () => media?.removeEventListener('change', f);
  }, []);
  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={sombre}
      className="inline-flex min-h-9 items-center gap-2 rounded-[2px] border border-line-strong bg-surface px-2.5 font-display text-[11.5px] font-semibold tracking-[0.08em] text-ink uppercase hover:border-ink"
    >
      {sombre ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
      <span>{sombre ? 'Thème clair' : 'Thème sombre'}</span>
    </button>
  );
}

function AlertesGlobales() {
  const persistance = useSyncExternalStore(abonnerEtatStockage, persistanceAssuree, () => true);
  const alerte = usePortefeuilles((s) => s.alerteChargement);
  const effacer = usePortefeuilles((s) => s.effacerAlerteChargement);
  if (persistance && !alerte) return null;
  return (
    <div className="no-print mx-auto mt-4 flex max-w-[1240px] flex-col gap-2 px-4 md:px-6">
      {!persistance && (
        <Avis ton="alerte" titre="Stockage local indisponible" role="status">
          Vos modifications sont conservées pendant la session uniquement. Exportez vos portefeuilles en JSON pour les garder.
        </Avis>
      )}
      {alerte && (
        <Avis ton="alerte" role="status">
          {alerte}{' '}
          <button type="button" onClick={effacer} className="underline">
            Masquer
          </button>
        </Avis>
      )}
    </div>
  );
}

export function AppShell() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <button
        type="button"
        onClick={() => document.getElementById('contenu')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Aller au contenu
      </button>
      <header className="no-print sticky top-0 z-40 border-b border-line-strong bg-surface">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMenuOuvert(false)}>
            <Logo />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-[0.08em] text-ink uppercase">AI Use Case Factory</span>
              <span className="mono mt-1 hidden text-[10px] tracking-[0.04em] text-muted sm:block">ATELIER DE CADRAGE · v1.0</span>
            </span>
          </Link>
          <nav aria-label="Navigation principale" className="ml-4 hidden items-stretch self-stretch md:flex">
            {LIENS.map((l) => (
              <NavLink
                key={l.vers}
                to={l.vers}
                end={l.fin}
                className={({ isActive }) =>
                  `relative flex items-center px-3 font-display text-[13px] font-semibold tracking-[0.08em] uppercase ${
                    isActive ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-sig-yellow' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {l.libelle}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <BasculeTheme />
            <a
              href={LIEN_DEPOT}
              className="inline-flex min-h-9 items-center gap-1.5 px-2 font-display text-[11.5px] font-semibold tracking-[0.08em] text-muted uppercase hover:text-ink"
            >
              Code source
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-[2px] border border-line-strong md:hidden"
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOuvert((o) => !o)}
          >
            {menuOuvert ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
        {menuOuvert && (
          <div id="menu-mobile" className="border-t border-line px-4 pb-4 md:hidden">
            <nav aria-label="Navigation principale (mobile)" className="flex flex-col">
              {LIENS.map((l) => (
                <NavLink
                  key={l.vers}
                  to={l.vers}
                  end={l.fin}
                  onClick={() => setMenuOuvert(false)}
                  className={({ isActive }) =>
                    `border-b border-line py-3 font-display text-[14px] font-semibold tracking-[0.08em] uppercase ${isActive ? 'text-ink' : 'text-muted'}`
                  }
                >
                  {l.libelle}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-3">
              <BasculeTheme />
              <a href={LIEN_DEPOT} className="text-[13px] text-muted underline">
                Code source
              </a>
            </div>
          </div>
        )}
      </header>

      <AlertesGlobales />

      <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<Chargement />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="no-print mt-16 border-t border-line-strong bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-[13px] text-muted md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-ink">
            Projet réalisé par <strong className="font-semibold">Youssef Mir</strong> — Business Analyst IA
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a className="underline hover:text-ink" href={LIEN_GITHUB}>
              github.com/youssefmir
            </a>
            <a className="underline hover:text-ink" href={LIEN_DEPOT}>
              Dépôt du projet
            </a>
            <span>Données de démonstration fictives</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function Chargement() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6" role="status">
      <p className="label-caps">Chargement…</p>
    </div>
  );
}
