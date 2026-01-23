/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Chrome Auto Dark Mode Integration
                background: {
                    DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
                    secondary: 'rgb(var(--color-background-secondary) / <alpha-value>)',
                },
                foreground: {
                    DEFAULT: 'rgb(var(--color-foreground) / <alpha-value>)',
                    secondary: 'rgb(var(--color-foreground-secondary) / <alpha-value>)',
                    muted: 'rgb(var(--color-foreground-muted) / <alpha-value>)',
                },
                card: {
                    DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
                },
                border: {
                    DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
                    light: 'rgb(var(--color-border-light) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
                },
                link: {
                    DEFAULT: 'rgb(var(--color-link) / <alpha-value>)',
                },
            },
            backgroundColor: {
                primary: 'rgb(var(--color-background) / <alpha-value>)',
                secondary: 'rgb(var(--color-background-secondary) / <alpha-value>)',
                card: 'rgb(var(--color-card) / <alpha-value>)',
            },
            textColor: {
                primary: 'rgb(var(--color-foreground) / <alpha-value>)',
                secondary: 'rgb(var(--color-foreground-secondary) / <alpha-value>)',
                muted: 'rgb(var(--color-foreground-muted) / <alpha-value>)',
                link: 'rgb(var(--color-link) / <alpha-value>)',
            },
            borderColor: {
                DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
                light: 'rgb(var(--color-border-light) / <alpha-value>)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                dubai: ['Dubai', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
                inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                cairo: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
                tajawal: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
                poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
            },
            animation: {
                'bounce-gentle': 'bounce 2s infinite',
                'shimmer': 'shimmer 1.5s infinite',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200px 0' },
                    '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
                },
            },
        },
    },
    plugins: [],
}
