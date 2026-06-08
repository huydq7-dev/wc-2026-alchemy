import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import usersRouter from './routes/users.js';
import matchesRouter from './routes/matches.js';
import predictionsRouter from './routes/predictions.js';
import leaderboardRouter from './routes/leaderboard.js';
import fundRouter from './routes/fund.js';
import authRouter from './routes/auth.js';
import rulesRouter from './routes/rules.js';
import syncRouter from './routes/sync.js';
import standingsRouter from './routes/standings.js';
import bracketRouter from './routes/bracket.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDB();

// Routes
app.use('/api/users', usersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/fund', fundRouter);
app.use('/api/auth', authRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/matches/sync', syncRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/bracket', bracketRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
