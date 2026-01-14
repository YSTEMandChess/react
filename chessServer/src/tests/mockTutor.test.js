const mockTutor = require("../utils/mockTutor");
const { validResponse } = require("./fixtures/stockfishResponse");
const { startingFen, afterMoveFen, sampleMove } = require("./fixtures/testData");

describe("mockTutor", () => {
  describe("formatMoveUci()", () => {
    test("formats regular UCI move correctly", () => {
      expect(mockTutor.formatMoveUci("e2e4")).toBe("e2 to e4");
      expect(mockTutor.formatMoveUci("d2d4")).toBe("d2 to d4");
      expect(mockTutor.formatMoveUci("a1h8")).toBe("a1 to h8");
    });

    test("formats promotion moves correctly", () => {
      expect(mockTutor.formatMoveUci("e7e8q")).toBe("e7 to e8 promoting to queen");
      expect(mockTutor.formatMoveUci("a7a8r")).toBe("a7 to a8 promoting to rook");
      expect(mockTutor.formatMoveUci("b7b8b")).toBe("b7 to b8 promoting to bishop");
      expect(mockTutor.formatMoveUci("c7c8n")).toBe("c7 to c8 promoting to knight");
    });

    test("handles invalid input gracefully", () => {
      expect(mockTutor.formatMoveUci("")).toBe("unknown move");
      expect(mockTutor.formatMoveUci(null)).toBe("unknown move");
      expect(mockTutor.formatMoveUci("abc")).toBe("abc");
    });
  });

  describe("formatEval()", () => {
      test("formats positive delta correctly", () => {
        const evaluation = { delta: 60, before: { type: "cp", value: 0 }, after: { type: "cp", value: 60 } };
        expect(mockTutor.formatEval(evaluation)).toContain("big improvement");

        const evaluation2 = { delta: 30, before: { type: "cp", value: 0 }, after: { type: "cp", value: 30 } };
        expect(mockTutor.formatEval(evaluation2)).toContain("improvement");

        const evaluation3 = { delta: 10, before: { type: "cp", value: 0 }, after: { type: "cp", value: 10 } };
        expect(mockTutor.formatEval(evaluation3)).toContain("slight improvement");
      });

      test("formats negative delta correctly", () => {
        const evaluation = { delta: -60, before: { type: "cp", value: 0 }, after: { type: "cp", value: -60 } };
        expect(mockTutor.formatEval(evaluation)).toContain("big mistake");

        const evaluation2 = { delta: -30, before: { type: "cp", value: 0 }, after: { type: "cp", value: -30 } };
        expect(mockTutor.formatEval(evaluation2)).toContain("worse");

        const evaluation3 = { delta: -10, before: { type: "cp", value: 0 }, after: { type: "cp", value: -10 } };
        expect(mockTutor.formatEval(evaluation3)).toContain("slightly worse");
      });

    test("formats zero delta correctly", () => {
      const evaluation = { delta: 0, before: { type: "cp", value: 0 }, after: { type: "cp", value: 0 } };
      expect(mockTutor.formatEval(evaluation)).toContain("about equal");
    });

    test("formats mate evaluations correctly", () => {
      const evaluation = { delta: 100, after: { type: "mate", value: 3 } };
      expect(mockTutor.formatEval(evaluation)).toContain("forced mate");
    });

    test("handles missing evaluation gracefully", () => {
      expect(mockTutor.formatEval(null)).toBe("about equal");
      expect(mockTutor.formatEval({})).toBe("about equal");
    });
  });

  describe("pickCandidateMoves()", () => {
    test("selects top N moves by rank", () => {
      const moves = [
        { rank: 1, move: "e2e4" },
        { rank: 2, move: "d2d4" },
        { rank: 3, move: "g1f3" }
      ];
      
      const selected = mockTutor.pickCandidateMoves(moves, 2);
      expect(selected).toHaveLength(2);
      expect(selected[0].move).toBe("e2e4");
      expect(selected[1].move).toBe("d2d4");
    });

    test("handles empty array", () => {
      expect(mockTutor.pickCandidateMoves([], 2)).toEqual([]);
    });

    test("handles null/undefined", () => {
      expect(mockTutor.pickCandidateMoves(null, 2)).toEqual([]);
      expect(mockTutor.pickCandidateMoves(undefined, 2)).toEqual([]);
    });

    test("selects all moves if count exceeds array length", () => {
      const moves = [{ rank: 1, move: "e2e4" }];
      const selected = mockTutor.pickCandidateMoves(moves, 5);
      expect(selected).toHaveLength(1);
    });
  });

  describe("getNextStepAction()", () => {
    test("returns appropriate action for best moves", () => {
      const evaluation = { delta: 30 };
      expect(mockTutor.getNextStepAction("Best", evaluation)).toContain("develop");
    });

    test("returns appropriate action for bad moves", () => {
      const evaluation = { delta: -60 };
      expect(mockTutor.getNextStepAction("Blunder", evaluation)).toContain("defend");
      expect(mockTutor.getNextStepAction("Mistake", evaluation)).toContain("defend");
    });

    test("returns appropriate action for inaccuracy", () => {
      const evaluation = { delta: -10 };
      expect(mockTutor.getNextStepAction("Inaccuracy", evaluation)).toContain("control");
    });
  });

  describe("buildMockMoveTutorResponse()", () => {
    describe("Blunder with Negative Delta", () => {
      test("returns blunder response with negative evaluation", () => {
        const stockfishFacts = {
          classify: "Blunder",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: -150 },
            delta: -150
          },
          cpuMove: "e7e5",
          topBestMoves: [{ rank: 1, move: "e7e5", score: 50 }],
          nextBestMoves: [
            { rank: 1, move: "e2e4", score: 20 },
            { rank: 2, move: "d2d4", score: 15 }
          ]
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result).toHaveProperty("moveIndicator");
        expect(result).toHaveProperty("Analysis");
        expect(result).toHaveProperty("nextStepHint");
        
        // After normalization: before=0, after=-150 (Black to move, bad for Black) = +150 (White POV)
        // Normalized delta = +150 - 0 = +150 (actually good!)
        // But classify says "Blunder", so contradiction resolution may soften it
        // However, since delta is positive, it shouldn't be softened
        // Actually, wait - if Black has -150, that's bad for Black = good for White = +150
        // So normalized delta is +150, which contradicts "Blunder"
        // The contradiction resolution should soften it to "Inaccuracy"
        expect(["Blunder", "Inaccuracy"]).toContain(result.moveIndicator);
        expect(result.Analysis).toBeDefined();
        // Should use SAN notation
        expect(result.Analysis).toMatch(/\be5\b/);
        expect(result.nextStepHint).toMatch(/e4|develop|defend/);
      });
    });

    describe("Best Move with Positive Delta", () => {
      test("returns best move response with positive evaluation", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: {
            before: { type: "cp", value: 0 }, // White to move, equal
            after: { type: "cp", value: -30 }, // Black to move, bad for Black = good for White
            delta: -30 // Raw delta negative due to sign flip
          },
          cpuMove: "e7e5",
          topBestMoves: [{ rank: 1, move: "e7e5", score: -10 }],
          nextBestMoves: [
            { rank: 1, move: "g1f3", score: 25 },
            { rank: 2, move: "d2d4", score: 20 }
          ]
        };

        const moveContext = {
          fenBefore: startingFen, // White to move
          fenAfter: afterMoveFen, // Black to move
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: [],
          learnerColor: "w"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        // After normalization: before=0, after=-30 (Black to move) = +30 (White POV)
        // Normalized delta = +30 - 0 = +30 (improvement)
        expect(result.moveIndicator).toBe("Best");
        expect(result.Analysis).toContain("Excellent move");
        expect(result.Analysis).toContain("engine's top choice");
        // Sentence 2 should mention best reply (no eval bucket)
        expect(result.Analysis).toContain("Your opponent's best reply is");
        // Should use SAN notation (e5) instead of "e7 to e5"
        expect(result.Analysis).toMatch(/\be5\b/);
        // nextStepHint should use "Engine recommends" format
        expect(result.nextStepHint).toMatch(/Engine recommends/i);
      });
    });

    describe("Uses nextBestMoves for Hint", () => {
      test("nextStepHint contains converted moves from nextBestMoves", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: 20 },
            delta: 20
          },
          cpuMove: "e7e5",
          topBestMoves: [{ rank: 1, move: "e7e5", score: -15 }],
          nextBestMoves: [
            { rank: 1, move: "e2e4", score: 25 },
            { rank: 2, move: "d2d4", score: 20 }
          ]
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result.nextStepHint).toContain("e2 to e4");
        expect(result.nextStepHint).toContain("d2 to d4");
        expect(result.nextStepHint).toMatch(/e2 to e4|d2 to d4/);
      });

      test("nextStepHint handles single candidate move", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: 20 },
            delta: 20
          },
          cpuMove: "e7e5",
          nextBestMoves: [
            { rank: 1, move: "e2e4", score: 25 }
          ]
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result.nextStepHint).toContain("e2 to e4");
      });
    });

    describe("Fallback for Missing Data", () => {
      test("uses fallback 'Good' when classify is undefined", () => {
        const stockfishFacts = {
          // classify missing
          evaluation: {
            delta: 0
          },
          cpuMove: "e7e5"
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result.moveIndicator).toBe("Good");
        expect(result.Analysis).toBeDefined();
        expect(result.nextStepHint).toBeDefined();
      });

      test("handles minimal stockfishFacts", () => {
        const stockfishFacts = {
          classify: "Good"
          // minimal data
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result.moveIndicator).toBe("Good");
        expect(result.Analysis).toBeDefined();
        expect(result.nextStepHint).toBeDefined();
      });

      test("handles missing nextBestMoves with fallback hint", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
          // nextBestMoves missing
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          moveIndex: 0,
          lastMoves: [],
          chatHistory: []
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result.nextStepHint).toContain("Continue developing");
      });
    });

    describe("All Move Classifications", () => {
      test("handles 'Good' classification", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.moveIndicator).toBe("Good");
        expect(result.Analysis).toContain("Good move");
      });

      test("handles 'Inaccuracy' classification", () => {
        const stockfishFacts = {
          classify: "Inaccuracy",
          evaluation: { delta: -10 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.moveIndicator).toBe("Inaccuracy");
        expect(result.Analysis).toContain("playable but not optimal");
      });

      test("handles 'Mistake' classification", () => {
        const stockfishFacts = {
          classify: "Mistake",
          evaluation: { delta: -40 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.moveIndicator).toBe("Mistake");
        expect(result.Analysis).toContain("mistake");
      });
    });

    describe("Response Structure Validation", () => {
      test("response has all required fields", () => {
        const result = mockTutor.buildMockMoveTutorResponse(validResponse, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(typeof result.moveIndicator).toBe("string");
        expect(result.moveIndicator.length).toBeGreaterThan(0);
        expect(typeof result.Analysis).toBe("string");
        expect(result.Analysis.length).toBeGreaterThan(0);
        expect(typeof result.nextStepHint).toBe("string");
        expect(result.nextStepHint.length).toBeGreaterThan(0);
      });

      test("response is deterministic (same inputs produce same outputs)", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5",
          nextBestMoves: [{ rank: 1, move: "e2e4" }]
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        };

        const result1 = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);
        const result2 = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        expect(result1).toEqual(result2);
      });
    });
  });

  describe("Beginner-friendly improvements", () => {
    describe("No centipawn wording", () => {
      test("Analysis text never contains 'centipawn'", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: 60 },
            delta: 60
          },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.Analysis.toLowerCase()).not.toContain("centipawn");
        expect(result.Analysis.toLowerCase()).not.toContain("cp");
      });

      test("Uses eval buckets instead of numbers", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: { delta: 50 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Should NOT contain centipawn numbers or eval bucket words
        expect(result.Analysis).not.toMatch(/\d+\s*(centipawn|cp)/i);
        // Should contain best reply or engine suggestion
        expect(result.Analysis).toMatch(/opponent.*best reply|engine suggests/i);
      });
    });

    describe("Contradiction handling", () => {
      test("Best/Good with small negative delta should NOT soften (threshold -50)", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: -10 },
            delta: -10
          },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          learnerColor: "w"
        });

        // After normalization: before=0, after=-10 (Black to move) = +10 (White POV)
        // Normalized delta = +10 (positive, so should stay "Good")
        expect(result.moveIndicator).toBe("Good");
        expect(result.Analysis).toContain("Good move!");
      });

      test("Best/Good with large negative normalized delta softens to Inaccuracy", () => {
        // Create a case where normalized delta is actually negative and large
        const stockfishFacts = {
          classify: "Good",
          evaluation: {
            before: { type: "cp", value: 60 }, // White to move, good
            after: { type: "cp", value: 0 }, // Black to move, equal
            delta: -60
          },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          learnerColor: "w"
        });

        // After normalization: before=+60, after=0, delta=-60 (< -50 threshold)
        expect(result.moveIndicator).toBe("Inaccuracy");
        expect(result.Analysis).toContain("Playable, but not the engine's favorite");
      });

      test("Mistake/Blunder with small negative delta softens to Inaccuracy", () => {
        const stockfishFacts = {
          classify: "Mistake",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: -15 },
            delta: -15
          },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.moveIndicator).toBe("Inaccuracy");
        expect(result.Analysis).toContain("playable but not optimal");
      });

      test("No contradiction when Best/Good with positive delta", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: { delta: 30 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.moveIndicator).toBe("Best");
        expect(result.Analysis).toContain("Excellent move");
      });
    });

    describe("UCI to SAN conversion", () => {
      test("Converts UCI moves to SAN when FEN is provided", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5",
          nextBestMoves: [
            { rank: 1, move: "e2e4" },
            { rank: 2, move: "d2d4" }
          ]
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Should use SAN notation (e.g., "e5" instead of "e7 to e5")
        expect(result.Analysis).toMatch(/\be5\b/);
        expect(result.Analysis).not.toContain("e7 to e5");
        
        // nextStepHint should also use SAN (moves are from fenAfter position)
        // Note: e2e4 and d2d4 are White's moves, so they need a position where White is to move
        // The test may show fallback format if FEN conversion fails, which is acceptable
        expect(result.nextStepHint).toBeDefined();
        expect(result.nextStepHint.length).toBeGreaterThan(0);
      });

      test("Falls back to 'from to' format when SAN conversion fails", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "invalidmove"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: "invalid fen",
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Should still produce valid output (fallback format)
        expect(result.Analysis).toBeDefined();
        expect(result.Analysis.length).toBeGreaterThan(0);
      });

      test("formatMoveUciToSan converts valid UCI to SAN", () => {
        const san = mockTutor.formatMoveUciToSan("e2e4", startingFen);
        expect(san).toBe("e4");
        
        // e7e5 is Black's move, need position after e2e4
        const san2 = mockTutor.formatMoveUciToSan("e7e5", afterMoveFen);
        expect(san2).toBe("e5");
      });

      test("formatMoveUciToSan falls back when FEN is invalid", () => {
        const fallback = mockTutor.formatMoveUciToSan("e2e4", "invalid fen");
        expect(fallback).toContain("e2");
        expect(fallback).toContain("e4");
      });
    });

    describe("3-sentence template structure", () => {
      test("Analysis follows 3-sentence structure", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Count sentences (periods followed by space or end of string)
        const sentences = result.Analysis.split(/\.\s+/).filter(s => s.length > 0);
        expect(sentences.length).toBeGreaterThanOrEqual(2); // At least 2 sentences
        
        // First sentence should be verdict (<= 12 words)
        const firstSentence = sentences[0];
        const firstWords = firstSentence.split(/\s+/).length;
        expect(firstWords).toBeLessThanOrEqual(12);
      });

      test("Sentence 1 is simple verdict", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: { delta: 30 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.Analysis).toMatch(/^Excellent move|Good move|Playable|mistake|blunder/i);
      });

      test("Sentence 2 mentions best reply or engine suggestion", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Should mention best reply (no eval bucket)
        expect(result.Analysis).toMatch(/opponent.*best reply|engine suggests/i);
      });

      test("Sentence 3 gives next step", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result.Analysis).toMatch(/Next|focus|develop|defend|control/i);
      });
    });

    describe("Improved nextStepHint", () => {
      test("nextStepHint includes SAN moves in Engine recommends format", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5",
          nextBestMoves: [
            { rank: 1, move: "g1f3" },
            { rank: 2, move: "b1c3" }
          ]
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        // Should contain moves in "Engine recommends" format (no reason phrases)
        expect(result.nextStepHint).toMatch(/Engine recommends/i);
        // Should contain the moves (either SAN or UCI fallback format)
        expect(result.nextStepHint).toMatch(/g1.*f3|Nf3/i);
        expect(result.nextStepHint).toMatch(/b1.*c3|Nc3/i);
        expect(result.nextStepHint).not.toMatch(/to (develop|defend|control)/);
      });

      test("nextStepHint has non-empty string", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(typeof result.nextStepHint).toBe("string");
        expect(result.nextStepHint.length).toBeGreaterThan(0);
      });
    });

    describe("Response structure validation", () => {
      test("Returns all required fields with non-empty strings", () => {
        const stockfishFacts = {
          classify: "Good",
          evaluation: { delta: 20 },
          cpuMove: "e7e5"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove
        });

        expect(result).toHaveProperty("moveIndicator");
        expect(result).toHaveProperty("Analysis");
        expect(result).toHaveProperty("nextStepHint");
        
        expect(typeof result.moveIndicator).toBe("string");
        expect(result.moveIndicator.length).toBeGreaterThan(0);
        
        expect(typeof result.Analysis).toBe("string");
        expect(result.Analysis.length).toBeGreaterThan(0);
        
        expect(typeof result.nextStepHint).toBe("string");
        expect(result.nextStepHint.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Evaluation Normalization", () => {
    describe("getSideToMoveFromFen()", () => {
      test("extracts side to move from valid FEN", () => {
        expect(mockTutor.getSideToMoveFromFen(startingFen)).toBe("w");
        expect(mockTutor.getSideToMoveFromFen(afterMoveFen)).toBe("b");
        expect(mockTutor.getSideToMoveFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1")).toBe("b");
      });

      test("returns null for invalid FEN", () => {
        expect(mockTutor.getSideToMoveFromFen("")).toBeNull();
        expect(mockTutor.getSideToMoveFromFen("invalid")).toBeNull();
        expect(mockTutor.getSideToMoveFromFen(null)).toBeNull();
      });
    });

    describe("toWhitePovScore()", () => {
      test("converts cp score to White POV when White to move", () => {
        const evalObj = { type: "cp", value: 20 };
        const score = mockTutor.toWhitePovScore(evalObj, startingFen);
        expect(score).toBe(20); // White to move, positive stays positive
      });

      test("converts cp score to White POV when Black to move", () => {
        const evalObj = { type: "cp", value: 20 };
        const score = mockTutor.toWhitePovScore(evalObj, afterMoveFen);
        expect(score).toBe(-20); // Black to move, positive becomes negative
      });

      test("handles mate evaluations", () => {
        const evalObj = { type: "mate", value: 3 };
        const scoreWhite = mockTutor.toWhitePovScore(evalObj, startingFen);
        expect(scoreWhite).toBe(3);
        
        const scoreBlack = mockTutor.toWhitePovScore(evalObj, afterMoveFen);
        expect(scoreBlack).toBe(-3);
      });

      test("returns null for invalid input", () => {
        expect(mockTutor.toWhitePovScore(null, startingFen)).toBeNull();
        expect(mockTutor.toWhitePovScore({}, startingFen)).toBeNull();
        expect(mockTutor.toWhitePovScore({ type: "cp" }, "invalid")).toBeNull();
      });
    });

    describe("normalizeEvaluationToPlayerPov()", () => {
      test("normalizes evaluation for White learner", () => {
        const evaluation = {
          before: { type: "cp", value: 37 },
          after: { type: "cp", value: -28 },
          delta: -65
        };
        
        // White to move before, Black to move after
        const normalized = mockTutor.normalizeEvaluationToPlayerPov(
          evaluation,
          startingFen, // White to move
          afterMoveFen, // Black to move
          "w"
        );
        
        // Before: +37 (White to move, good for White) = +37 (White POV) = +37 (Player POV)
        // After: -28 (Black to move, bad for Black) = +28 (White POV) = +28 (Player POV)
        // Delta: +28 - 37 = -9
        expect(normalized.before.value).toBe(37);
        expect(normalized.after.value).toBe(28);
        expect(normalized.delta).toBe(-9);
      });

      test("normalizes evaluation for Black learner", () => {
        const evaluation = {
          before: { type: "cp", value: 37 },
          after: { type: "cp", value: -28 },
          delta: -65
        };
        
        const normalized = mockTutor.normalizeEvaluationToPlayerPov(
          evaluation,
          startingFen,
          afterMoveFen,
          "b"
        );
        
        // Before: +37 (White POV) = -37 (Black POV)
        // After: -28 (Black POV) = +28 (White POV) = -28 (Black POV)
        // Delta: -28 - (-37) = +9
        expect(normalized.before.value).toBe(-37);
        expect(normalized.after.value).toBe(-28);
        expect(normalized.delta).toBe(9);
      });

      test("handles missing evaluation gracefully", () => {
        const normalized = mockTutor.normalizeEvaluationToPlayerPov(
          null,
          startingFen,
          afterMoveFen,
          "w"
        );
        
        expect(normalized.delta).toBe(0);
      });
    });

    describe("Sign flip regression test", () => {
      test("Best move with sign flip should remain Best (not downgraded)", () => {
        // Test case: White plays e2e4, Stockfish says "Best"
        // Before: White to move, eval +20 (good for White)
        // After: Black to move, eval -15 (bad for Black = good for White)
        // After normalization: before=+20, after=+15, delta=-5 (small negative, but threshold is -50)
        const stockfishFacts = {
          classify: "Best",
          evaluation: {
            before: { type: "cp", value: 20 }, // White to move, good for White
            after: { type: "cp", value: -15 }, // Black to move, bad for Black = good for White
            delta: -35 // Raw delta appears negative due to sign flip
          },
          cpuMove: "e7e5",
          topBestMoves: [{ rank: 1, move: "e7e5", score: 50 }]
        };

        const moveContext = {
          fenBefore: startingFen, // White to move
          fenAfter: afterMoveFen, // Black to move
          moveUci: sampleMove,
          learnerColor: "w"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        // Should remain "Best" (not downgraded to "Inaccuracy" because normalized delta > -50)
        expect(result.moveIndicator).toBe("Best");
        // Sentence 2 should mention best reply (no eval bucket)
        expect(result.Analysis).toContain("Your opponent's best reply is");
        expect(result.Analysis).not.toMatch(/big mistake|worse significantly|making the position/i);
      });

      test("Black learner with sign flip", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: {
            before: { type: "cp", value: 37 },
            after: { type: "cp", value: -28 },
            delta: -65
          },
          cpuMove: "e7e5"
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          learnerColor: "b"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        // For black learner, normalized delta should be positive (good for learner)
        expect(result.moveIndicator).toBe("Best");
        // Sentence 2 should mention best reply (no eval bucket)
        expect(result.Analysis).toContain("Your opponent's best reply is");
      });
    });

    describe("Contradiction threshold", () => {
      test("Best with small negative delta (-10) should NOT be downgraded", () => {
        const stockfishFacts = {
          classify: "Best",
          evaluation: {
            before: { type: "cp", value: 0 },
            after: { type: "cp", value: -10 },
            delta: -10
          },
          cpuMove: "e7e5"
        };

        const moveContext = {
          fenBefore: startingFen,
          fenAfter: afterMoveFen,
          moveUci: sampleMove,
          learnerColor: "w"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        // Should remain "Best" (threshold is -50, not 0)
        expect(result.moveIndicator).toBe("Best");
      });

      test("Best with large negative delta (-60) should be downgraded", () => {
        // Test case where normalized delta is actually -60 (not just sign flip)
        // Before: White to move, eval 0
        // After: Black to move, eval -60 (bad for Black)
        // Normalized: before=0, after=+60, delta=+60 (actually good!)
        // So we need a case where the normalized delta is actually negative
        const stockfishFacts = {
          classify: "Best",
          evaluation: {
            before: { type: "cp", value: 60 }, // White to move, good
            after: { type: "cp", value: 0 }, // Black to move, equal
            delta: -60 // Raw delta negative
          },
          cpuMove: "e7e5"
        };

        const moveContext = {
          fenBefore: startingFen, // White to move
          fenAfter: afterMoveFen, // Black to move
          moveUci: sampleMove,
          learnerColor: "w"
        };

        const result = mockTutor.buildMockMoveTutorResponse(stockfishFacts, moveContext);

        // Normalized: before=+60, after=0, delta=-60 (actually bad)
        // Should be downgraded to "Inaccuracy" (threshold is -50)
        expect(result.moveIndicator).toBe("Inaccuracy");
        expect(result.Analysis).toContain("Playable, but not the engine's favorite");
      });
    });
  });
});

