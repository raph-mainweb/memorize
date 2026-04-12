import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter Tight — headlines, h1–h5
        heading: ['var(--font-inter-tight)', 'sans-serif'],
        // Montserrat — body text, paragraphs
        sans: ['var(--font-montserrat)', 'sans-serif'],
        // Dancing Script — subtitle labels above H1
        script: ['var(--font-dancing-script)', 'cursive'],
        // Legacy serif alias (kept for admin pages)
        serif: ['var(--font-inter-tight)', 'sans-serif'],
      },
      colors: {
        // Primary brand: Lavendel #968cb5
        brand: {
          50:  '#f5f3fa',
          100: '#eae6f4',  // = secondary color
          200: '#d5cce9',
          300: '#baafd8',
          400: '#9e91c7',
          500: '#968cb5',  // = primary color
          600: '#7d72a0',
          700: '#655a86',
          800: '#4e456a',
          900: '#38304e',
        },
        // Navy from logo "MEMORIAL"
        navy: {
          50:  '#eef0f7',
          100: '#d5d9ec',
          500: '#3d4f8f',
          700: '#1e2b5e',
          900: '#111a3c',
        },
        // Stone background tones (kept)
        stone: {
          50: '#faf9f8',
          100: '#f5f3ef',
          200: '#e8e4dc',
          900: '#1c1917',
        },
        // Legacy sage — kept for backward compat in admin, mapped to brand
        sage: {
          50:  '#f5f3fa',
          100: '#eae6f4',
          200: '#d5cce9',
          500: '#968cb5',
          600: '#7d72a0',
          700: '#655a86',
          800: '#4e456a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.7s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
