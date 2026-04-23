import Link from 'next/link';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Impressum — studypod.ai',
};

export default function ImpressumPage() {
  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={
        <Link href="/" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Home</Link>
      } />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-press-start)] text-lg mb-8">IMPRESSUM</h1>

        <div className="space-y-6 text-sm text-[var(--c-muted)]">
          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">Angaben gemäß § 5 DDG</h2>
            <p>[Dein vollständiger Name]</p>
            <p>[Straße und Hausnummer]</p>
            <p>[PLZ Ort]</p>
            <p>Deutschland</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">Kontakt</h2>
            <p>E-Mail: [deine@email.de]</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>[Dein vollständiger Name]</p>
            <p>[Adresse wie oben]</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" className="text-[var(--c-primary)]" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
