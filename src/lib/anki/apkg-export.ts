interface AnkiNote {
  front: string;
  back: string;
  tags: string[];
}

interface ExportOptions {
  deckName: string;
  notes: AnkiNote[];
  mediaFiles?: { filename: string; data: Buffer }[];
}

export async function generateApkg(options: ExportOptions): Promise<Buffer> {
  const { deckName, notes, mediaFiles = [] } = options;

  // Dynamic import to avoid Turbopack bundling the browser path
  // @ts-expect-error — anki-apkg-export has no type declarations
  const AnkiExport = (await import('anki-apkg-export')).default;

  const apkg = new AnkiExport(deckName);

  for (const media of mediaFiles) {
    apkg.addMedia(media.filename, media.data);
  }

  for (const note of notes) {
    apkg.addCard(note.front, note.back, { tags: note.tags });
  }

  const zip = await apkg.save();
  return Buffer.from(zip);
}
