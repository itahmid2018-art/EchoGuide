import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateTourNarration, discoverNearbyLandmarks, askTourGuide, optimizeTourRoute, geocodeLocation, fetchRealTimeWeather } from './src/server/geminiTourService.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API endpoints
app.get('/api/tour/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query params are required' });
    }
    const weather = await fetchRealTimeWeather(lat, lng);
    if (!weather) {
      return res.status(500).json({ error: 'Failed to retrieve weather' });
    }
    res.json(weather);
  } catch (err: any) {
    console.error('Weather error:', err);
    res.status(500).json({ error: err?.message || 'Failed to retrieve weather' });
  }
});

app.post('/api/tour/geocode', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const result = await geocodeLocation(query);
    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result);
  } catch (err: any) {
    console.error('Geocode error:', err);
    res.status(500).json({ error: err?.message || 'Failed to geocode location' });
  }
});

app.post('/api/tour/narrate', async (req, res) => {
  try {
    const narration = await generateTourNarration(req.body);
    res.json(narration);
  } catch (err: any) {
    console.error('Narration error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate narration' });
  }
});

app.post('/api/tour/discover', async (req, res) => {
  try {
    const landmarks = await discoverNearbyLandmarks(req.body);
    res.json(landmarks);
  } catch (err: any) {
    console.error('Discovery error:', err);
    res.status(500).json({ error: err?.message || 'Failed to discover landmarks' });
  }
});

app.post('/api/tour/ask', async (req, res) => {
  try {
    const answer = await askTourGuide(req.body);
    res.json(answer);
  } catch (err: any) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err?.message || 'Failed to answer question' });
  }
});

app.post('/api/tour/optimize-route', async (req, res) => {
  try {
    const plan = await optimizeTourRoute(req.body);
    res.json(plan);
  } catch (err: any) {
    console.error('Optimize route error:', err);
    res.status(500).json({ error: err?.message || 'Failed to optimize route' });
  }
});

// Serve production static assets
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
