interface FlashcardForExport {
  front: string;
  back: string;
  explanation: string;
  audioUrl: string | null;
  difficulty: number;
}

interface AnkiNote {
  front: string;
  back: string;
  tags: string[];
}

export function buildAnkiNotes(
  cards: FlashcardForExport[],
  topic: string
): AnkiNote[] {
  const topicTag = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return cards.map((card) => {
    const difficultyTag = `difficulty::${card.difficulty}`;

    let back = card.back;
    if (card.explanation) {
      back += `<hr><p style="color: #666; font-size: 0.9em;">${card.explanation}</p>`;
    }
    if (card.audioUrl) {
      const filename = card.audioUrl.split('/').pop() || 'audio.mp3';
      back += `<br>[sound:${filename}]`;
    }

    return {
      front: card.front,
      back,
      tags: ['studypod', topicTag, difficultyTag],
    };
  });
}
