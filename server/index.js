import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Express app: lightweight HTTP server for SvelteKit + WebSocket proxy
// This server also bridges WebSocket events to enable real-time syncing

import { handler } from '../build/handler.js';

// Setup a WebSocket bridge to forward events between clients

const port = 3000; // port to listen on
const app = express();
const server = createServer(app);

const io = new Server(server);

io.on('connection', (socket) => {
	// When a client connects, listen for events from that client
	// and broadcast them to all connected clients (real-time sync)
	socket.on('eventFromClient', (message) => {
		io.emit('eventFromServer', message);
		console.log('Received from client:', message);
	});
});

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);
