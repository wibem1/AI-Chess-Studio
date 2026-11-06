/** Synthetic legal PGN, not the user's real Lichess acceptance game. */
export const REVIEW_PGN = `[Event "Synthetic review fixture"]
[White "Ada"]
[Black "wibem"]
[Result "1/2-1/2"]
[TimeControl "600+0"]

1. e4 {[%clk 0:09:55]} e5 {Eigener PGN-Kommentar <img src=x onerror=alert(1)> [%clk 0:09:40] [%eval 0.2]}
2. Nf3 {[%clk 0:09:45]} Nc6 {[%clk 0:09:35]}
3. Bb5 a6 {[%clk 0:09:15]}
4. Ba4 {[%clk 0:09:30]} Nf6 {[%clk 0:09:00]} 1/2-1/2`;
export const REPETITION_PGN = `[White "Human"]
[Black "Other"]
[Result "1/2-1/2"]

1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 5. Nf3 Nf6 6. Ng1 Ng8 7. Nf3 Nf6 8. Ng1 Ng8 1/2-1/2`;
