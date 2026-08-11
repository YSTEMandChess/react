export type GameMetaData = {
  userId?: number;
  user?: User;
  opponent?: User;
  uuid?: string;
  opponentId?: string;
  gameName: string;
  gameType: "computer" | "friend" | "mentor" | "guest";
  computerLevel: number | null;
  fen: string;
  movesList: string[];
  playerColor: "white" | "black";
  status: "won" | "lost" | "ongoing" | "draw";
  createdAt: string;
  updatedAt: string;
};
export type User = {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  id: number;
  _id?: number;
};
