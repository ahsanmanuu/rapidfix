/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'selector',
    theme: {
        extend: {
            colors: {
                // Using modern CSS color function syntax to support Tailwind's opacity modifiers
                primary: 'hsl(var(--primary-h) var(--primary-s) var(--primary-l) / <alpha-value>)',
                secondary: 'hsl(var(--secondary-h) var(--secondary-s) var(--secondary-l) / <alpha-value>)',
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "surface-dark": "#111722",
                "card-dark": "#232f48",
                "text-secondary": "#92a4c9",
                "accent-green": "#0bda5e",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
