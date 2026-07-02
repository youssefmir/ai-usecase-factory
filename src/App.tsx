import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { MotionConfig } from 'motion/react';
import { AppShell } from './app/AppShell';
import { PortfolioLayout } from './app/PortfolioLayout';

const Vitrine = lazy(() => import('./pages/vitrine/VitrinePage'));
const Portefeuilles = lazy(() => import('./pages/portefeuilles/PortefeuillesPage'));
const TableauDeBord = lazy(() => import('./pages/tableau/TableauDeBordPage'));
const FicheCas = lazy(() => import('./pages/cas/FicheCasPage'));
const NoteCadrage = lazy(() => import('./pages/note/NoteCadragePage'));
const Matrice = lazy(() => import('./pages/matrice/MatricePage'));
const Roadmap = lazy(() => import('./pages/roadmap/RoadmapPage'));
const Parametres = lazy(() => import('./pages/parametres/ParametresPage'));
const Assistant = lazy(() => import('./pages/assistant/AssistantPage'));
const Methode = lazy(() => import('./pages/methode/MethodePage'));
const Introuvable = lazy(() => import('./pages/IntrouvablePage'));

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Vitrine />} />
            <Route path="atelier" element={<Portefeuilles />} />
            <Route path="atelier/:pid" element={<PortfolioLayout />}>
              <Route index element={<TableauDeBord />} />
              <Route path="matrice" element={<Matrice />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="cas/:cid/note" element={<NoteCadrage />} />
              <Route path="cas/:cid" element={<FicheCas />} />
              <Route path="cas/:cid/:onglet" element={<FicheCas />} />
            </Route>
            <Route path="methode" element={<Methode />} />
            <Route path="*" element={<Introuvable />} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  );
}
