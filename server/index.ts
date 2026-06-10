import app from './app.js';
import { startAutoSync } from './services/matchSync.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);

  // Start auto-sync for match results (every 5 min via Highlightly)
  if (process.env.HIGHLIGHTLY_API_KEY && process.env.HIGHLIGHTLY_API_KEY !== "your_highlightly_api_key_here") {
    startAutoSync(300_000);
  }
});
