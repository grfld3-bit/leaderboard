import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Leaderboard
  app.get("/api/leaderboard", (req, res) => {
    // Mock data for the leaderboard as requested
    const leaderboardData = [
      { user_id: 8447684216, score: 150000, username: "Courtney Henry" },
      { user_id: 123456789, score: 120000, username: "Watson Bane" },
      { user_id: 987654321, score: 115000, username: "Leslie Alexander" },
      { user_id: 456789123, score: 110000, username: "Eleanor Pena" },
      { user_id: 321654987, score: 105000, username: "Arlene McCoy" },
      { user_id: 159357258, score: 100000, username: "Albert Flores" },
      { user_id: 753159852, score: 95000, username: "Bessie Cooper" },
      { user_id: 258456123, score: 90000, username: "Arlene McCoy" },
      { user_id: 951753456, score: 85000, username: "Dianne Russell" },
      { user_id: 357159258, score: 80000, username: "Ronald Richards" },
    ];

    res.json({
      status: "success",
      data: leaderboardData,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
