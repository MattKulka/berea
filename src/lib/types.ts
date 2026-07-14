export type Verse = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  text: string;
};

export type SemanticMatch = Verse & { similarity: number };

export type CrossReference = {
  id: number;
  votes: number;
  toStart: Verse;
  toEnd: Verse;
};
