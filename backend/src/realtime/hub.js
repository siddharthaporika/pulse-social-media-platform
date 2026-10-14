// src/realtime/hub.js
const clients = new Set();

/**
 * Register an SSE client
 */
export function addClient(res) {
  clients.add(res);
}

/**
 * Remove SSE client (on disconnect)
 */
export function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}
