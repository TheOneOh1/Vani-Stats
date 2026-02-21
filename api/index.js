import { fetchLanguages } from '../src/fetchLanguages.js';
import { calculateStats } from '../src/calculateStats.js';
import { generateSVG, generateErrorSVG } from '../src/generateSVG.js';

const VALID_THEMES = ['tokyonight', 'dark', 'light'];

/**
 * Vercel serverless function handler.
 * GET /api?username=xxx&theme=tokyonight&max_langs=8
 */
export default async function handler(req, res) {
    const { username, theme = 'tokyonight', max_langs = '8' } = req.query;

    // ── Resolve theme ──
    const resolvedTheme = VALID_THEMES.includes(theme) ? theme : 'tokyonight';

    // ── Validate username ──
    if (!username) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store');
        return res.status(400).send(
            generateErrorSVG(
                'Missing required query parameter: username. Usage: /api?username=TheOneOh1',
                resolvedTheme
            )
        );
    }

    const maxLangs = Math.min(Math.max(parseInt(max_langs, 10) || 8, 1), 20);

    try {
        const token = process.env.GITHUB_TOKEN;
        const languageBytes = await fetchLanguages(username, token);

        if (Object.keys(languageBytes).length === 0) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.status(200).send(
                generateErrorSVG(
                    `No public language data found for user "${username}". They may have no public repos or only forked repos.`,
                    resolvedTheme
                )
            );
        }

        const stats = calculateStats(languageBytes, maxLangs);
        const svg = generateSVG(stats, resolvedTheme);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(svg);
    } catch (err) {
        let message = 'An unexpected error occurred while fetching data.';

        if (err.code === 'RATE_LIMITED') {
            message = 'GitHub API rate limit exceeded. Please try again later.';
        } else if (err.code === 'NOT_FOUND') {
            message = `GitHub user "${username}" not found. Please check the username.`;
        } else if (err.code === 'API_ERROR') {
            message = `GitHub API error: ${err.message}`;
        }

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store');
        return res.status(200).send(generateErrorSVG(message, resolvedTheme));
    }
}
