import { setResponseHeaders } from 'expo-server';

export default async function middleware(request: Request) {
  const start = Date.now();
  const url = new URL(request.url);
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] → ${request.method} ${url.pathname}`);
  
  // Log request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.clone().text();
      if (body) console.log(`  Body: ${body}`);
    } catch {}
  }
  
  // Add response time header
  setResponseHeaders((headers) => {
    const duration = Date.now() - start;
    headers.set('X-Response-Time', `${duration}ms`);
    console.log(`[${timestamp}] ← ${request.method} ${url.pathname} (${duration}ms)`);
  });
}
