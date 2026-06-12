import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Direct, unblocked Server-Side Proxy for Sankavollerei Anime API
  app.get('/api/anime/*', async (req, res) => {
    try {
      // Safely extract paths after /api/anime/ (11 characters)
      const proxyPath = req.path.substring(11);
      
      // Construct target URL including original query parameters
      const targetUrl = new URL(`https://www.sankavollerei.com/anime/${proxyPath}`);
      Object.entries(req.query).forEach(([key, val]) => {
        if (typeof val === 'string') {
          targetUrl.searchParams.append(key, val);
        } else if (Array.isArray(val)) {
          val.forEach(v => {
            if (typeof v === 'string') {
              targetUrl.searchParams.append(key, v);
            }
          });
        }
      });

      // Fetch server-side (node-fetch standard on modern Node, with fallback to globally available fetch)
      const response = await fetch(targetUrl.toString());
      
      // Forward the status
      res.status(response.status);
      
      // Forward contentType header
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }
      
      // Optional: Prevent caching of search/detail queries
      res.setHeader('Cache-Control', 'no-store, max-age=0');

      // Send the response
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        res.json(json);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error(`Proxy error at ${req.path}:`, error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Proxy failed to fetch from target server', 
        details: error.message 
      });
    }
  });

  // Vite configuration & static asset serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Use *all for Express v5 compatibility as mandated
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
