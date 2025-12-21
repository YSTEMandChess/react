const config = require("config");
const express = require('express');
const router = express.Router();
require('dotenv').config();
const axios = require("axios");


const stockFishURL = 'http://localhost:8080';

function extractEval(infoLines = []) {
  const last = [...infoLines].reverse().find(l => l.includes("score"));
  if (!last) return null;

  const mate = last.match(/score mate (-?\d+)/);
  const cp = last.match(/score cp (-?\d+)/);

  if (mate) return `Mate in ${mate[1]}`;
  if (cp) return (Number(cp[1]) / 100).toFixed(2);

  return null;
}

function extractPV(infoLines = []) {
  const last = [...infoLines].reverse().find(l => l.includes(" pv "));
  if (!last) return [];
  return last.split(" pv ")[1].split(" ");
}



router.post("/analysis", async (req, res) => {
  console.log("AI Tutor Analysis Called");

  try {
    const {
      type,                // "move" | "question"
      fen_before,
      fen_after,
      move,
      uciHistory,
      depth = 12,
      question,
      chatHistory = []
    } = req.body;
    console.log(req.body);

    let stockfishSummary = null;

    // =========================
    // 1️⃣ MOVE → Stockfish
    // =========================
    if (type === "move") {
      if (!fen_before || !move) {
        return res.status(400).json({ error: "fen_before and move required" });
      }

      const sfResponse = await axios.post(
        `${stockFishURL}/analysis`,
        {
          fen: fen_before,
          moves: move,
          depth
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const sf = sfResponse.data;

      stockfishSummary = {
        bestMove: sf.bestMove,
        evaluation: extractEval(sf.infoLines),
        pv: extractPV(sf.infoLines)
      };
    }

    // =========================
    // 2️⃣ Build LLM messages
    // =========================
    const messages = [
      {
        role: "system",
        content: `
            You are a chess tutor AI.

            Rules:
            - Stockfish evaluation is ground truth.
            - Explain moves constructively.
            - Be concise and educational.
            - Never insult the player.
            - If a move is bad, explain why and suggest improvement.
            `
      },
      ...chatHistory
    ];

    // Inject Stockfish data (authoritative)
    if (stockfishSummary) {
      messages.push({
        role: "system",
        content: JSON.stringify({
          type: "engine_analysis",
          ...stockfishSummary
        })
      });

      messages.push({
        role: "user",
        content: `I played the move ${move}. Please explain it.`
      });
    }

    // Question-only path
    if (type === "question" && question) {
      messages.push({
        role: "user",
        content: question
      });
    }

    // =========================
    // 3️⃣ Call OpenAI
    // =========================
    // const completion = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages,
    //   temperature: 0.4
    // });

    // const reply = completion.choices[0].message.content;
    const reply = "Response from LLM (yet to implemnt this feature)"

    // =========================
    // 4️⃣ Response
    // =========================
    res.json({
      reply,
      bestMove: stockfishSummary ?  stockfishSummary.bestMove : ""
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Tutor analysis failed" });
  }
});


// //Handles move/Full game analysis, uses LLM to interpret and sends back to user.
// router.post("/analysis",async (req, res) => {
//     console.log("Move Analysis Called")
//     try{
//         const { fen, moves = "", depth = 12 } = req.body; 

//         //send to stockfish server
//         const response = await axios.post(
//             `${stockFishURL}/analysis`, 
//             { fen, moves, depth },
//             { headers: { "Content-Type": "application/json" } }
//         );
//         //use llm to uindersatdn the stockfish analysis
//         const stockfishData = response.data;
//         console.log(stockfishData)
//         console.log({
//             bestMove: stockfishData.bestMove,
//             evaluation: extractEval(stockfishData.infoLines),
//             pv: extractPV(stockfishData.infoLines),
//         });
//         res.json({
//             bestMove: stockfishData.bestMove,
//             evaluation: extractEval(stockfishData.infoLines),
//             pv: extractPV(stockfishData.infoLines),
//         });

//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({ error: "Analysis failed" });
//     }
//     //send back llm response and stockfish move(CPU Move) to frontend
    
// })



module.exports = router;