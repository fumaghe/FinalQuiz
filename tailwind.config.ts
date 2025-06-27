
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Apple Design System Colors
				'apple-blue': '#007AFF',
				'apple-green': '#34C759',
				'apple-red': '#FF3B30',
				'apple-yellow': '#FF9F0A',
				'apple-light': '#F2F2F7',
				'apple-card': '#FFFFFF',
				'apple-text': '#000000',
				'apple-secondary': '#3C3C4399',
				'apple-border': '#E5E5EA',
				'apple-pressed': '#D1D1D6',
				
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#007AFF',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: '#FF3B30',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#F2F2F7',
					foreground: '#3C3C4399'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			fontFamily: {
				'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'sans-serif'],
			},
			fontSize: {
				'h1': ['32px', { lineHeight: '40px', fontWeight: '600' }],
				'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }], 
				'h3': ['18px', { lineHeight: '24px', fontWeight: '400' }],
				'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
				'caption': ['14px', { lineHeight: '20px', fontWeight: '400' }],
				'small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
			},
			spacing: {
				'apple': '8px',
				'apple-2x': '16px',
				'apple-3x': '24px',
				'apple-4x': '32px',
			},
			borderRadius: {
				'apple': '12px',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'apple': '0 2px 4px rgba(0, 0, 0, 0.1)',
				'apple-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
			},
			keyframes: {
				'apple-tap': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.96)' },
					'100%': { transform: 'scale(1)' }
				},
				'fade-slide-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateX(20px)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'fade-slide-out': {
					'0%': { 
						opacity: '1',
						transform: 'translateX(0)'
					},
					'100%': { 
						opacity: '0',
						transform: 'translateX(-20px)'
					}
				},
				'feedback-flash': {
					'0%': { borderColor: 'transparent' },
					'50%': { borderColor: 'currentColor' },
					'100%': { borderColor: 'transparent' }
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'apple-tap': 'apple-tap 100ms ease-out',
				'fade-slide-in': 'fade-slide-in 300ms ease-out',
				'fade-slide-out': 'fade-slide-out 300ms ease-out',
				'feedback-flash': 'feedback-flash 200ms ease-out',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
