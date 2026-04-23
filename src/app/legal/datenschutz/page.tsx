import Link from 'next/link';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Datenschutzerklärung — studypod.ai',
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={
        <Link href="/" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Home</Link>
      } />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-press-start)] text-lg mb-8">DATENSCHUTZ</h1>

        <div className="space-y-6 text-sm text-[var(--c-muted)] leading-relaxed">
          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">1. Verantwortlicher</h2>
            <p>[Dein Name und Adresse — wie im Impressum]</p>
            <p>E-Mail: [deine@email.de]</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">2. Erhobene Daten</h2>
            <p>Bei der Nutzung von studypod.ai werden folgende Daten verarbeitet:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>E-Mail-Adresse und Benutzername (bei Registrierung)</li>
              <li>Von Ihnen eingegebene Studienthemen und hochgeladene Dokumente</li>
              <li>Lernfortschritt (Karteikarten-Bewertungen, XP-Punkte, Streaks)</li>
              <li>Technische Daten (IP-Adresse, Browser-Typ, Zeitstempel)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">3. Auftragsverarbeiter</h2>
            <ul className="list-disc ml-4 space-y-2">
              <li><strong>Supabase (AWS eu-central-1)</strong> — Datenbank, Authentifizierung, Dateispeicherung</li>
              <li><strong>Google (Gemini API)</strong> — KI-gestützte Inhaltsverarbeitung. Hochgeladene Dokumente und Themen werden zur Verarbeitung an Google-Server übermittelt.</li>
              <li><strong>LemonSqueezy</strong> — Zahlungsabwicklung (Merchant of Record). Zahlungsdaten werden ausschließlich von LemonSqueezy verarbeitet.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">4. Rechtsgrundlage</h2>
            <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Dokumenten-Upload).</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">5. Ihre Rechte</h2>
            <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Kontaktieren Sie uns per E-Mail.</p>
          </section>

          <section>
            <h2 className="font-semibold text-[var(--c-fg)] mb-2">6. Löschung</h2>
            <p>Ihre Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt oder Sie Ihr Konto löschen. Zahlungsdaten werden gemäß gesetzlicher Aufbewahrungsfristen (§ 147 AO) aufbewahrt.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
