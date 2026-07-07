import { useMemo } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import { useAnalysePortefeuille, usePortefeuilleCourant } from '../../app/hooks';
import { telecharger } from '../../app/telechargement';
import { useTitre } from '../../app/useTitre';
import { nomFichierExport } from '../../domain/io';
import { construireNote, noteVersMarkdown, type Bloc } from '../../domain/note/note';
import { Button, ButtonLink } from '../../ui/Button';
import { Reveal } from '../../ui/Reveal';
import { BadgeAiAct, TagQuadrant } from '../../ui/Signals';

function RenduBloc({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case 'paragraphe':
      return <p className="text-[13.5px] leading-relaxed">{bloc.texte}</p>;
    case 'liste': {
      const Liste = bloc.ordonnee ? 'ol' : 'ul';
      return (
        <Liste className={`flex flex-col gap-1 pl-5 text-[13.5px] leading-relaxed ${bloc.ordonnee ? 'list-decimal' : 'list-disc'}`}>
          {bloc.elements.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </Liste>
      );
    }
    case 'definitions':
      return (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13.5px] sm:grid-cols-[11rem_1fr]">
          {bloc.elements.map((e) => (
            <div key={e.terme} className="contents">
              <dt className="font-semibold text-ink">{e.terme}</dt>
              <dd className="text-ink/90">{e.definition}</dd>
            </div>
          ))}
        </dl>
      );
    case 'encadre':
      return <p className="avoid-break border-l-4 border-sig-yellow bg-sig-yellow-soft px-3 py-2 text-[13px]">{bloc.texte}</p>;
    case 'tableau':
      return (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="table-tech text-[12.5px]">
            <thead>
              <tr>
                {bloc.entetes.map((e, i) => (
                  <th key={e} scope="col" className={bloc.droite?.includes(i) ? 'text-right' : ''}>
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloc.lignes.map((l, i) => (
                <tr key={i}>
                  {l.map((c, j) => (
                    <td key={j} className={bloc.droite?.includes(j) ? 'mono text-right whitespace-nowrap' : ''}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function NoteCadragePage() {
  const portefeuille = usePortefeuilleCourant();
  const analyse = useAnalysePortefeuille(portefeuille);
  const { cid } = useParams();
  const analyseCas = analyse.cas.find((a) => a.cas.id === cid);
  const entree = analyse.roadmap.entrees.find((e) => e.casId === cid);
  const note = useMemo(() => (analyseCas ? construireNote(analyseCas, portefeuille, entree) : null), [analyseCas, portefeuille, entree]);
  useTitre(note ? `Note de cadrage ${note.code}` : 'Note de cadrage');

  if (!analyseCas || !note) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold">Cas d’usage introuvable</h1>
        <ButtonLink to={`/atelier/${portefeuille.id}`} className="mt-6">
          Retour au tableau de bord
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink to={`/atelier/${portefeuille.id}/cas/${analyseCas.cas.id}`} variante="discret" icone={<ArrowLeft className="size-4" aria-hidden="true" />}>
          Retour à la fiche
        </ButtonLink>
        <div className="flex flex-wrap gap-2">
          <Button
            icone={<FileDown className="size-4" aria-hidden="true" />}
            onClick={() => telecharger(nomFichierExport(`note-cadrage-${note.code || note.titre}`, 'md'), noteVersMarkdown(note), 'text/markdown')}
          >
            Exporter en Markdown
          </Button>
          <Button variante="primaire" icone={<Printer className="size-4" aria-hidden="true" />} onClick={() => window.print()}>
            Imprimer / PDF
          </Button>
        </div>
      </div>

      <Reveal>
        <article className="mx-auto max-w-[210mm] border border-line-strong bg-surface px-[14mm] py-[14mm] text-ink print:max-w-none print:border-0 print:p-0">
          {/* Cartouche façon plan technique */}
          <header className="avoid-break border-2 border-ink">
            <div className="flex items-stretch border-b-2 border-ink">
              <div className="flex flex-1 flex-col justify-center px-4 py-3">
                <p className="label-caps">Note de cadrage · cas d’usage IA</p>
                <h1 className="mt-1 text-[24px] leading-tight font-semibold">{note.titre}</h1>
              </div>
              <div className="flex w-36 flex-col items-center justify-center border-l-2 border-ink bg-ink px-3 py-3 text-bg">
                <span className="font-display text-[10px] tracking-[0.12em] uppercase opacity-80">Réf.</span>
                <span className="mono text-[16px] font-semibold">{note.code || '—'}</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 text-[12px] sm:grid-cols-3">
              {note.cartouche.slice(1).map((c, i) => (
                <div key={c.terme} className={`border-ink px-4 py-2 ${i % 3 !== 2 ? 'sm:border-r' : ''} ${i < 3 ? 'sm:border-b' : ''}`}>
                  <dt className="label-caps text-[9.5px]">{c.terme}</dt>
                  <dd className="mt-0.5 font-medium">{c.definition}</dd>
                </div>
              ))}
            </dl>
          </header>

          <div className="avoid-break mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4">
            <TagQuadrant quadrant={analyseCas.scoring.quadrant} />
            <BadgeAiAct niveau={analyseCas.aiAct.niveau} provisoire={analyseCas.aiAct.niveauProvisoire} taille="sm" />
          </div>

          {note.sections.map((s) => (
            <section key={s.numero} className="mt-6">
              <h2 className="flex items-baseline gap-3 border-b border-ink pb-1.5 text-[17px] font-semibold [break-after:avoid]">
                <span className="mono text-[12px] text-muted">{s.numero.padStart(2, '0')}</span>
                {s.titre}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {s.blocs.map((b, i) => (
                  <RenduBloc key={i} bloc={b} />
                ))}
              </div>
            </section>
          ))}

          <footer className="avoid-break mt-8 border-t-2 border-ink pt-3 text-[11.5px] text-muted">
            {note.mentions.map((m) => (
              <p key={m}>{m}</p>
            ))}
            <p className="mt-1">AI Use Case Factory · projet de Youssef Mir, Business Analyst IA</p>
          </footer>
        </article>
      </Reveal>
    </div>
  );
}
