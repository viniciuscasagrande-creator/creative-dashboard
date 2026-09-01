import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { handleApiRequest } from './src/api/mockRouter.js';

// Custom plugin to serve the mock API routes
function mockApiPlugin() {
  return {
    name: 'vite-plugin-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        
        // Only handle requests starting with /api/v1
        if (url && url.startsWith('/api/v1')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*'); // Enable CORS
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          
          try {
            const mockDataPath = path.resolve(process.cwd(), 'src/api/mockData.json');
            const rawData = fs.readFileSync(mockDataPath, 'utf8');
            const data = JSON.parse(rawData);
            
            // Clean up query parameters or trailing slashes
            const cleanUrl = url.split('?')[0].replace(/\/$/, '');
            
            // Helper to save data back to JSON file
            const saveData = () => {
              fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2), 'utf8');
            };
            
            // Pass the request to our modular router
            const handled = await handleApiRequest(req, res, cleanUrl, data, saveData);
            if (handled) {
              return;
            }
            
            // Fallback for custom legacy routes or old mappings
            if (cleanUrl === '/api/v1/dashboard') {
              res.end(JSON.stringify(data.dashboard));
              return;
            } else if (cleanUrl === '/api/v1/dashboard/cards') {
              res.end(JSON.stringify(data.cards));
              return;
            } else if (cleanUrl === '/api/v1/dashboard/graficos') {
              res.end(JSON.stringify(data.graficos));
              return;
            } else if (cleanUrl === '/api/v1/dashboard/kpis') {
              res.end(JSON.stringify(data.kpis));
              return;
            } else if (cleanUrl === '/api/v1/dashboard/fluxo-caixa') {
              res.end(JSON.stringify(data['fluxo-caixa']));
              return;
            } else if (cleanUrl === '/api/v1/dashboard/previsoes') {
              res.end(JSON.stringify(data.previsoes));
              return;
            }
            
            // If route not matched under /api/v1
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint not found', path: cleanUrl }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Server error parsing mock data', details: error.message }));
            return;
          }
        }
        
        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: false
  },
  plugins: [mockApiPlugin()]
});
