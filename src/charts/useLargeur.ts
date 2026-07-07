import { useLayoutEffect, useRef, useState } from 'react';

/** Largeur disponible d'un conteneur (ResizeObserver), pour des graphiques SVG adaptatifs. */
export function useLargeur<T extends HTMLElement>(defaut = 640) {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(defaut);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setLargeur(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    mesurer();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, largeur };
}
