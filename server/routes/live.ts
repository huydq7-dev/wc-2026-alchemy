import { Router } from "express";
import { getMatches, getMatchDetail, getLineups } from "../services/liveData.js";

const router = Router();

// GET /api/live/matches — upcoming & live World Cup matches
router.get("/matches", async (_req, res) => {
  try {
    const date = _req.query.date as string | undefined;
    const matches = await getMatches(date);
    res.json({ matches, updated: new Date().toISOString() });
  } catch (err: any) {
    console.error("[live] matches error:", err.message);
    res.status(502).json({ error: "Live data unavailable" });
  }
});

// GET /api/live/match/:id — full match detail with events
router.get("/match/:id", async (req, res) => {
  try {
    const detail = await getMatchDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json({ match: detail, updated: new Date().toISOString() });
  } catch (err: any) {
    console.error("[live] match detail error:", err.message);
    res.status(502).json({ error: "Live data unavailable" });
  }
});

// GET /api/live/match/:id/lineups — lineups for a match
router.get("/match/:id/lineups", async (req, res) => {
  try {
    const lineups = await getLineups(req.params.id);
    if (!lineups) {
      return res.status(404).json({ error: "Lineups not available yet" });
    }
    res.json({ lineups, updated: new Date().toISOString() });
  } catch (err: any) {
    console.error("[live] lineups error:", err.message);
    res.status(502).json({ error: "Live data unavailable" });
  }
});

export default router;
