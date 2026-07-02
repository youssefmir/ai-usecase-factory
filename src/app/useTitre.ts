import { useEffect } from 'react';

/** Titre de l'onglet du navigateur. */
export function useTitre(titre: string) {
  useEffect(() => {
    document.title = titre ? `${titre} · AI Use Case Factory` : 'AI Use Case Factory';
  }, [titre]);
}
