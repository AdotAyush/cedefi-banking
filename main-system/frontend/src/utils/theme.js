// Tailwind color mapping utility for theme-aware styles
export const themeColors = {
    // Text colors
    text: {
        primary: 'data-[theme=corporate]:text-gray-900 data-[theme=business]:text-slate-100',
        secondary: 'data-[theme=corporate]:text-gray-600 data-[theme=business]:text-slate-300',
        muted: 'data-[theme=corporate]:text-gray-500 data-[theme=business]:text-slate-400',
        subtle: 'data-[theme=corporate]:text-gray-400 data-[theme=business]:text-slate-500',
    },
    // Background colors
    bg: {
        card: 'data-[theme=corporate]:bg-white data-[theme=business]:bg-white/5',
        input: 'data-[theme=corporate]:bg-gray-50 data-[theme=business]:bg-white/5',
    },
    // Border colors
    border: {
        default: 'data-[theme=corporate]:border-gray-200 data-[theme=business]:border-white/10',
    }
};

// Simple className helper for conditional theme classes
export const cn = (...classes) => classes.filter(Boolean).join(' ');
