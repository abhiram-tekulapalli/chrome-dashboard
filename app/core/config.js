/**
 * AURA ULTRA PREMIUM - Configuration
 * Central config, constants, and default data
 */

export const CONFIG = {
    defaultWallpaper: 'radial-gradient(130% 120% at 8% 6%, #2b2b2b 0%, #171717 32%, #0b0b0b 64%, #030303 100%), radial-gradient(90% 60% at 82% 18%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
    maxTaskLength: 180,
    maxLinkNameLength: 40,
    focusDurationSec: 25 * 60,
    breakDurationSec: 5 * 60,
    storageVersion: 2,
    keys: {
        theme: 'aura_theme',
        customBg: 'aura_custom_bg',
        customLinks: 'aura_custom_links',
        tasks: 'aura_tasks',
        notes: 'aura_notes',
        pomoState: 'aura_pomo_state',
        searchEngine: 'aura_search_engine',
        legacyBgIndex: 'aura_bg_index',
        settings: 'aura_settings'
    },
    defaultLinks: {
        'Development': [
            { name: 'GitHub', url: 'https://github.com' },
            { name: 'Vercel', url: 'https://vercel.com' },
            { name: 'Netlify', url: 'https://netlify.com' },
            { name: 'Figma', url: 'https://figma.com' },
            { name: 'StackOverflow', url: 'https://stackoverflow.com' }
        ],
        'DSA & Logic': [
            { name: 'LeetCode', url: 'https://leetcode.com' },
            { name: 'Codeforces', url: 'https://codeforces.com' },
            { name: 'HackerRank', url: 'https://hackerrank.com' },
            { name: 'GfG', url: 'https://geeksforgeeks.org' },
            { name: 'TakeUForward', url: 'https://takeuforward.org' }
        ],
        'AI & Tools': [
            { name: 'Gemini', url: 'https://gemini.google.com' },
            { name: 'Claude', url: 'https://claude.ai' },
            { name: 'Perplexity', url: 'https://perplexity.ai' },
            { name: 'CanIUse', url: 'https://caniuse.com' }
        ],
        'Workspace': [
            { name: 'ChatGPT', url: 'https://chatgpt.com' },
            { name: 'Gmail', url: 'https://mail.google.com' },
            { name: 'Notion', url: 'https://notion.so' },
            { name: 'YouTube', url: 'https://youtube.com' }
        ]
    }
};

export const SEARCH_ENGINES = {
    google: {
        label: 'Google',
        url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
    },
    duckduckgo: {
        label: 'DuckDuckGo',
        url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
    },
    bing: {
        label: 'Bing',
        url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
    },
    brave: {
        label: 'Brave',
        url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
    },
    perplexity: {
        label: 'Perplexity',
        url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`
    }
};

export const getSearchEngineValue = (value) => (
    typeof value === 'string' && value in SEARCH_ENGINES ? value : 'google'
);