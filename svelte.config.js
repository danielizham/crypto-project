import preprocess from "svelte-preprocess";
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        // hydrate the <div id="svelte"> element in src/app.html
        target: "#svelte",
        vite: {
            ssr: {
                external: ['firebase']
            }
        },
    },
    preprocess: [
        preprocess({
            postcss: true,
        }),
    ],
};

export default config;