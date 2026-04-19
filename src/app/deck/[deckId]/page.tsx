import Link from 'next/link';
import AnkiExportButton from '@/components/AnkiExportButton';

const MOCK_DECK = {
  id: 'demo-deck',
  topic: 'Photosynthesis',
  description: 'A comprehensive set of flashcards covering the process of photosynthesis in plants.',
  language: 'en',
  cardCount: 3,
  cards: [
    { id: '1', front: 'What is photosynthesis?', back: 'The process by which plants convert light energy into chemical energy.', explanation: '6CO2 + 6H2O + light = C6H12O6 + 6O2', difficulty: 2, audioUrl: null, orderIndex: 0 },
    { id: '2', front: 'Where does photosynthesis occur?', back: 'In the chloroplasts, specifically in the thylakoid membranes and stroma.', explanation: 'Chloroplasts contain chlorophyll, the green pigment that captures light.', difficulty: 1, audioUrl: null, orderIndex: 1 },
    { id: '3', front: 'What are the two stages of photosynthesis?', back: 'The light-dependent reactions and the Calvin cycle (light-independent reactions).', explanation: 'Light reactions happen in thylakoids; Calvin cycle happens in the stroma.', difficulty: 3, audioUrl: null, orderIndex: 2 },
  ],
};

export default function DeckPage() {
  const deck = MOCK_DECK;

  const difficultyColor = (d: number) => {
    if (d <= 2) return 'bg-[#00E896]/20 text-[#00E896]';
    if (d <= 3) return 'bg-[#FFD93D]/20 text-[#FFD93D]';
    return 'bg-[#FF6B8A]/20 text-[#FF6B8A]';
  };

  const difficultyLabel = (d: number) => {
    return ['', 'Basic', 'Easy', 'Medium', 'Hard', 'Expert'][d] || 'Medium';
  };

  return (
    <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8]">
      <nav className="border-b-2 border-[#2A3352]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
            <span className="text-[#7B5CFF]">study</span><span className="text-[#E8F0E8]">pod</span><span className="text-[#00E896]">.ai</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-press-start)] text-2xl mb-2">{deck.topic}</h1>
          <p className="text-[#6B7A99] mb-6">{deck.description}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/study/${deck.id}`}
              className="pixel-border-sm bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white px-6 py-3 font-semibold transition-pixel"
            >
              Begin Quest ({deck.cardCount} cards)
            </Link>
            <AnkiExportButton deckId={deck.id} topic={deck.topic} cardCount={deck.cardCount} />
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-press-start)] text-sm mb-4">Card Inventory</h2>
        <div className="grid gap-3">
          {deck.cards.map((card, i) => (
            <div key={card.id} className="pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-5 hover:border-[#7B5CFF]/30 transition-pixel">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[#6B7A99]">#{i + 1}</span>
                    <span className={`pixel-border-sm text-xs font-medium px-2 py-0.5 ${difficultyColor(card.difficulty)}`}>
                      {difficultyLabel(card.difficulty)}
                    </span>
                  </div>
                  <p className="font-medium mb-1">{card.front}</p>
                  <p className="text-sm text-[#6B7A99]">{card.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
