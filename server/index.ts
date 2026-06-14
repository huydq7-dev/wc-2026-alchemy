import app from './app.js';
import { startAutoSync } from './services/matchSync.js';
import { startScoreSync } from './services/scoreSync.js';
import { startFDSync } from './services/footballDataSync.js';
import { startWcstatSync } from './services/wcstatSync.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);

  // Primary: football-data.org (10 req/min, reliable) — every 60s
  startFDSync(60_000);

  // Backup: openfootball GitHub (free, no rate limit) — every 5 min
  startScoreSync(300_000);

  // Tertiary: Highlightly (only if API key is configured) — every 30 min
  if (
    process.env.HIGHLIGHTLY_API_KEY &&
    process.env.HIGHLIGHTLY_API_KEY !== 'your_highlightly_api_key_here'
  ) {
    startAutoSync(1_800_000);
  }

  // Free: wcstat.orangecloud.vn — every 60s (no API key needed)
  startWcstatSync(60_000);
});
