export type User = {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  id: number;
  _id?: number;
};

export type PuzzleMetaData = {
  userId?: number;
  user?: User;
  socketId?: string;

  PuzzleId: string;
  FEN: string;
  Moves: string;

  Rating?: number;
  RatingDeviation?: number;
  Popularity?: number;
  NbPlays?: number;

  Themes?: string;
  GameUrl?: string;
  OpeningTags?: string;
};
