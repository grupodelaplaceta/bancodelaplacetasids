import express from "express";
import { createServer as createViteServer } from "vite";
import handler from "./api/index";
import placetaidHandler from "./api/placetaid";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api", async (req, res) => {
    try {
      await handler(req, res);
    } catch (e: any) {
      console.error("API Error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || "Internal Server Error" });
      }
    }
  });

  app.post("/api/placetaid", async (req, res) => {
    try {
      await placetaidHandler(req, res);
    } catch (e: any) {
      console.error("PlacetaID API Error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || "Internal Server Error" });
      }
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("build"));
    app.get("*", (req, res) => {
      res.sendFile("build/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
