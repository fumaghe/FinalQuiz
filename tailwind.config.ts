
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
                                // ITSAR Design System Colors
                                'its-red': '#C01818',
                                'its-red-dark': '#BF0D0D',
                                'its-green': '#34C759',
                                'its-yellow': '#FF9F0A',
                                'its-light': '#FFFFFF',
                                'its-card': '#FFFFFF',
                                'its-text': '#000000',
                                'its-secondary': '#6B7280',
                                'its-border': '#E5E7EB',
                                'its-muted': '#F3F4F6',
                                'its-dark': '#1F2937',
                                'its-pressed': '#D1D1D6',
				
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
                                primary: {
                                        DEFAULT: '#C01818',
                                        foreground: '#FFFFFF'
                                },
                                secondary: {
                                        DEFAULT: '#BF0D0D',
                                        foreground: '#FFFFFF'
                                },
                                destructive: {
                                        DEFAULT: '#BF0D0D',
                                        foreground: '#FFFFFF'
                                },
                                muted: {
                                        DEFAULT: '#F3F4F6',
                                        foreground: '#6B7280'
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
                                sans: ['Inter', 'sans-serif'],
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
                                its: '8px',
                                'its-2x': '16px',
                                'its-3x': '24px',
                                'its-4x': '32px',
                        },
                        borderRadius: {
                                its: '12px',
                                lg: 'var(--radius)',
                                md: 'calc(var(--radius) - 2px)',
                                sm: 'calc(var(--radius) - 4px)'
                        },
                        boxShadow: {
                                its: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                'its-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
                        },
			keyframes: {
				'its-tap': {
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
				'its-tap': 'its-tap 100ms ease-out',
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
