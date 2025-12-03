// @type {import('tailwindcss').Config}
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            borderRadius: {
                xl: 'var(--radius)',
                '2xl': 'calc(var(--radius) + 4px)'
            },
            colors: {
                background: 'rgb(2 6 23)',
                card: 'rgba(255,255,255,0.02)',
                foreground: '#e2e8f0',
                muted: '#94a3b8',
            }
        },
    },
    plugins: [require("daisyui")],
}
