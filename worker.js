export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Si es la llamada a la IA
    if (url.pathname === '/api/claude' && request.method === 'POST') {
      try {
        const body = await request.json();
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: { message: e.message } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Para todo lo demás, servir el index.html
    return env.ASSETS.fetch(request);
  }
};
