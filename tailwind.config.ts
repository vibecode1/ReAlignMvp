import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Core Brand Colors - ReAlign 3.0
        'deep-ocean': '#0F172A',
        'calm-sky': '#3B82F6',
        'ocean-depth': '#1E3A8A',
        
        // Hope & Progress Colors
        'sage-green': '#10B981',
        'mint-fresh': '#6EE7B7',
        'forest-deep': '#047857',
        
        // Attention Colors
        'warm-amber': '#F59E0B',
        'soft-sunset': '#FCD34D',
        'autumn-glow': '#DC2626',
        
        // AI Intelligence Colors
        'lavender-mist': '#8B5CF6',
        'purple-glow': '#A78BFA',
        'cosmic-purple': '#6D28D9',
        
        // Semantic Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Emotional State Colors
        emotional: {
          stressed: '#EFF6FF',
          confused: '#F3F4F6',
          hopeful: '#ECFDF5',
          confident: '#FFFFFF',
        },
        
        // AI Confidence Colors
        ai: {
          high: '#10B981',
          medium: '#F59E0B',
          low: '#EF4444',
          thinking: '#8B5CF6',
        },
      },
      
      fontFamily: {
        sans: ['Inter var', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        conversational: ['SF Pro Display', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'display': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em' }],
        'h1': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
        'h2': ['24px', { lineHeight: '32px', letterSpacing: '0' }],
        'h3': ['20px', { lineHeight: '28px', letterSpacing: '0' }],
        'body-large': ['18px', { lineHeight: '28px', letterSpacing: '0' }],
        'body': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        'caption': ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
        'micro': ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
      },
      
      spacing: {
        'micro': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      
      animation: {
        'ai-thinking': 'aiThinking 2s ease-in-out infinite',
        'gentle-breathing': 'gentleBreathing 4s ease-in-out infinite',
        'subtle-glow': 'subtleGlow 2s ease-in-out infinite',
        'celebration': 'celebration 1s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      
      keyframes: {
        aiThinking: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        gentleBreathing: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        subtleGlow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        celebration: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(0deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      
      transitionTimingFunction: {
        'gentle': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'energetic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;
