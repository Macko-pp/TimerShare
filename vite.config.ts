import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

// Development-time WebSocket bridge: mirrors Socket.IO events for multi-client sync
const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		// Attach a WebSocket server to the Vite dev server so client-side
		// WebSocket events can be relayed during development
		if (!server.httpServer) return;

		const io = new Server(server.httpServer);

		io.on('connection', (socket: any) => {
			socket.on('eventFromClient', (message: any) => {
				io.emit('eventFromServer', message);
				console.log('Received from client:', message);
			});
		});
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer]
});
