export type Database = {
  public: {
    Tables: {
      game_reviews: {
        Row: {
          id: string;
          user_id: string;
          pgn: string;
          moves: string; // JSON stringified AnalyzedMove[]
          white_accuracy: number;
          black_accuracy: number;
          opening: string;
          eco: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pgn: string;
          moves: string;
          white_accuracy: number;
          black_accuracy: number;
          opening: string;
          eco: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_reviews"]["Insert"]>;
      };
    };
  };
};
