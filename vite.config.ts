import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { generateTourNarration, discoverNearbyLandmarks, askTourGuide, optimizeTourRoute, geocodeLocation, fetchRealTimeWeather, generateLandmarkImage } from './src/server/geminiTourService.ts';

dotenv.config();

function tourApiPlugin(): Plugin {
  return {
    name: 'tour-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/tour/')) {
          return next();
        }

        // Helper to read JSON request body
        const readBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        res.setHeader('Content-Type', 'application/json');

        try {
          if (req.url === '/api/tour/generate-image' && req.method === 'POST') {
            const body = await readBody();
            const imageUrl = await generateLandmarkImage(body.landmarkName, body.city || 'historic city');
            res.statusCode = 200;
            res.end(JSON.stringify({ imageUrl }));
            return;
          }
          if (req.url.startsWith('/api/tour/weather') && req.method === 'GET') {
            const urlObj = new URL(req.url, 'http://localhost');
            const lat = parseFloat(urlObj.searchParams.get('lat') || '');
            const lng = parseFloat(urlObj.searchParams.get('lng') || '');
            if (isNaN(lat) || isNaN(lng)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Valid lat and lng query params are required' }));
              return;
            }
            const weather = await fetchRealTimeWeather(lat, lng);
            if (!weather) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to retrieve weather' }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(weather));
            return;
          }

          if (req.url === '/api/tour/geocode' && req.method === 'POST') {
            const body = await readBody();
            const result = await geocodeLocation(body.query);
            if (!result) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Location not found' }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (req.url === '/api/tour/narrate' && req.method === 'POST') {
            const body = await readBody();
            const narration = await generateTourNarration(body);
            res.statusCode = 200;
            res.end(JSON.stringify(narration));
            return;
          }

          if (req.url === '/api/tour/discover' && req.method === 'POST') {
            const body = await readBody();
            const places = await discoverNearbyLandmarks(body);
            res.statusCode = 200;
            res.end(JSON.stringify(places));
            return;
          }

          if (req.url === '/api/tour/ask' && req.method === 'POST') {
            const body = await readBody();
            const answer = await askTourGuide(body);
            res.statusCode = 200;
            res.end(JSON.stringify(answer));
            return;
          }

          if (req.url === '/api/tour/optimize-route' && req.method === 'POST') {
            const body = await readBody();
            const plan = await optimizeTourRoute(body);
            res.statusCode = 200;
            res.end(JSON.stringify(plan));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err: any) {
          console.error('API Error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), tourApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
