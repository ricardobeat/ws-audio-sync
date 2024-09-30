
const server = Bun.serve({
  static: {
    "/index.html": await serveFile('./index.html'),
  },
  fetch(req, server) {
    const route = new URL(req.url).pathname;

    if (route === "/") {
      return serveFile('./index.html', 'text/html')
    }

    if (route === "/ws") {
      server.upgrade(req, {
        data: {
          channelId: new URL(req.url).searchParams.get("channelId"),
          // authToken: cookies["X-Token"],
        },
      });
    }

    return new Response('boo');
  },
  websocket: {
    open(ws) {
      ws.subscribe(ws.data.channelId)
    },
    async message(ws, message) {
      const { channelId } = ws.data
      const { action } = JSON.parse(message)

      if (action === "play" || action === "pause") {
        server.publish(channelId, JSON.stringify({ action }))
      }

      if (action === "ping") {
        ws.send(JSON.stringify({ action: 'pong' }))
      }
    },
  },
});

async function serveFile (path, type) {
  return new Response(await Bun.file(path).bytes(), {
    headers: { "Content-Type": type },
  })
}