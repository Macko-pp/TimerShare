import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		const io = new Server(server.httpServer);

		io.on('connection', (socket) => {
			socket.on('eventFromClient', (message) => {
				io.emit('eventFromServer', message);
				console.log('Received from client:', message);
			});
		});
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer]
});
