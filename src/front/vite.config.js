import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Redirige todas las llamadas que empiecen por /api al backend de Node
			'/api': {
				target: 'http://localhost:10000',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
