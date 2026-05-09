/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: 'rgb(var(--pulse-bg) / <alpha-value>)',
          card: 'rgb(var(--pulse-card) / <alpha-value>)',
          border: 'rgb(var(--pulse-border) / <alpha-value>)',
          accent: 'rgb(var(--pulse-accent) / <alpha-value>)',
          green: 'rgb(var(--pulse-green) / <alpha-value>)',
          red: 'rgb(var(--pulse-red) / <alpha-value>)',
          amber: 'rgb(var(--pulse-amber) / <alpha-value>)',
          cyan: 'rgb(var(--pulse-cyan) / <alpha-value>)',
          text: 'rgb(var(--pulse-text) / <alpha-value>)',
          muted: 'rgb(var(--pulse-muted) / <alpha-value>)',
        },
        'app-bg': 'rgb(var(--bg-primary) / <alpha-value>)',
        'app-card': 'rgb(var(--surface-card) / <alpha-value>)',
        'app-panel': 'rgb(var(--panel-elevated) / <alpha-value>)',
        'app-sidebar': 'rgb(var(--sidebar-bg) / <alpha-value>)',
        'app-border': 'rgb(var(--border-strong) / <alpha-value>)',
        'app-muted': 'rgb(var(--surface-muted) / <alpha-value>)',
        'app-text': 'rgb(var(--text-primary) / <alpha-value>)',
        'app-accent': 'rgb(var(--accent-primary) / <alpha-value>)',
        'app-accent-strong': 'rgb(var(--accent-strong) / <alpha-value>)',
        'app-cyan': 'rgb(var(--accent-cyan) / <alpha-value>)',
        'app-success': 'rgb(var(--state-success) / <alpha-value>)',
        'app-warning': 'rgb(var(--state-warning) / <alpha-value>)',
        'app-danger': 'rgb(var(--state-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 20px 55px -28px rgba(2, 6, 23, 0.55)',
        glow: '0 10px 30px -18px rgba(20, 184, 166, 0.55)',
      },
      backgroundImage: {
        'app-radial':
          'radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 28%), radial-gradient(circle at top right, rgba(103, 232, 249, 0.12), transparent 22%)',
        'app-glow':
          'linear-gradient(180deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0) 100%)',
        'app-hero':
          'linear-gradient(135deg, rgba(17, 24, 39, 0.94), rgba(11, 17, 32, 0.92)), radial-gradient(circle at top right, rgba(20, 184, 166, 0.18), transparent 30%)',
      },
    },
  },
  plugins: [],
};
