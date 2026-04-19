import { Podcast } from 'podcast';

interface FeedCard {
  id: string;
  front: string;
  back: string;
  explanation: string;
  audioUrl: string;
  durationSeconds: number;
  createdAt: string;
  deckTopic: string;
  orderIndex: number;
}

interface FeedUser {
  username: string | null;
  feedToken: string;
}

interface GenerateFeedOptions {
  user: FeedUser;
  cards: FeedCard[];
  baseUrl: string;
}

export function generateUserFeed(options: GenerateFeedOptions): string {
  const { user, cards, baseUrl } = options;

  const displayName = user.username || 'Student';

  const feed = new Podcast({
    title: `studypod.ai: ${displayName}'s Flashcards`,
    description: `AI-generated audio flashcards for ${displayName}. Subscribe to get new study material automatically.`,
    feedUrl: `${baseUrl}/api/feed/${user.feedToken}`,
    siteUrl: baseUrl,
    imageUrl: `${baseUrl}/images/podcast-cover.png`,
    author: 'studypod.ai',
    language: 'de',
    categories: ['Education', 'Self-Improvement'],
    itunesAuthor: 'studypod.ai',
    itunesCategory: [{ text: 'Education', subcats: [{ text: 'Self-Improvement' }] }],
    itunesImage: `${baseUrl}/images/podcast-cover.png`,
    itunesOwner: { name: 'studypod.ai', email: 'hello@studypod.ai' },
    itunesExplicit: false,
    itunesType: 'episodic',
  });

  // Sort by creation date (newest first)
  const sortedCards = [...cards].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const card of sortedCards) {
    const episodeTitle = `${card.deckTopic} #${card.orderIndex + 1}: ${card.front}`.slice(0, 120);

    feed.addItem({
      title: episodeTitle,
      description: `<p><strong>Question:</strong> ${escapeXml(card.front)}</p><p><strong>Answer:</strong> ${escapeXml(card.back)}</p>${card.explanation ? `<p><em>${escapeXml(card.explanation)}</em></p>` : ''}`,
      url: `${baseUrl}/deck/${card.id}`,
      guid: `studypod-card-${card.id}`,
      date: new Date(card.createdAt),
      enclosure: {
        url: card.audioUrl.startsWith('http') ? card.audioUrl : `${baseUrl}${card.audioUrl}`,
        type: 'audio/mpeg',
        size: card.durationSeconds * 16000, // Rough estimate: 128kbps
      },
      itunesDuration: card.durationSeconds,
      itunesEpisodeType: 'full',
    });
  }

  return feed.buildXml({ indent: '  ' });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
