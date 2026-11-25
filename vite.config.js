import { resolve } from 'path';

export default ({ mode }) => ({
    root: resolve(__dirname, 'src'),
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: mode !== 'development',
    },
    server: {
        port: 8080,
        proxy: {
            '/api': 'http://localhost:5000',
            '/images': 'http://localhost:5000',
        },
    },
});
