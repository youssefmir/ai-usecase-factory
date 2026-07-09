import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PortfolioLayout } from '../../app/PortfolioLayout';
import { portefeuillesDemo } from '../../data/demo';
import { usePortefeuilles } from '../../store/portfolioStore';
import AssistantPage from './AssistantPage';

const brouillon = {
  titre: 'Lecture automatique des bons de déchets',
  resume: 'Extraire les informations des bons photographiés.',
  probleme: 'Ressaisie manuelle de 1 800 bons par an.',
  processus: 'Gestion des déchets de chantier',
  typologie: 'extraction_documentaire',
  irritants: ['Bons illisibles', 'Oublis de tonnage'],
  volumeAnnuel: 1800,
  tempsUnitaireMin: 10,
  questionsOuvertes: ['Taux actuel de bons complets ?'],
};

function rendre() {
  return render(
    <MemoryRouter initialEntries={['/atelier/demo-ardoise-batiment/assistant']}>
      <Routes>
        <Route path="/atelier/:pid" element={<PortfolioLayout />}>
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="cas/:cid" element={<p>Fiche ouverte</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  usePortefeuilles.setState({ portefeuilles: portefeuillesDemo(), alerteChargement: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('page Assistant (réponse simulée)', () => {
  it('génère un brouillon relu puis crée la fiche dans le portefeuille', async () => {
    const fetchSimule = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(brouillon) } }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchSimule);
    const u = userEvent.setup();
    rendre();

    const bouton = screen.getByRole('button', { name: /Générer le brouillon/ });
    expect(bouton).toBeDisabled();
    await u.click(screen.getByRole('button', { name: /Exemple de notes/ }));
    await u.type(screen.getByLabelText(/Clé d’API/), 'cle-de-test');
    await u.click(bouton);

    expect(await screen.findByText('Brouillon à relire')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lecture automatique des bons de déchets')).toBeInTheDocument();
    expect(fetchSimule).toHaveBeenCalledOnce();

    await u.click(screen.getByRole('button', { name: /Retirer : Oublis de tonnage/ }));
    await u.click(screen.getByRole('button', { name: 'Créer la fiche' }));

    expect(await screen.findByText('Fiche ouverte')).toBeInTheDocument();
    const ardoise = usePortefeuilles.getState().portefeuilles.find((p) => p.id === 'demo-ardoise-batiment');
    const cree = ardoise?.cas.at(-1);
    expect(cree?.titre).toBe('Lecture automatique des bons de déchets');
    expect(cree?.code).toBe('UC-AB-006');
    expect(cree?.situationActuelle.irritants).toEqual(['Bons illisibles']);
  });

  it('affiche les erreurs sans rien créer si la réponse est invalide', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const u = userEvent.setup();
    rendre();
    await u.click(screen.getByRole('button', { name: /Exemple de notes/ }));
    await u.type(screen.getByLabelText(/Clé d’API/), 'mauvaise-cle');
    await u.click(screen.getByRole('button', { name: /Générer le brouillon/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Clé d’API refusée');
    expect(usePortefeuilles.getState().portefeuilles[1]?.cas).toHaveLength(5);
  });
});
