/**
 * GitHub-canonical language colors.
 * Source: https://github.com/ozh/github-colors
 */
const LANGUAGE_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Scala: '#c22d40',
    Shell: '#89e051',
    Lua: '#000080',
    R: '#198CE7',
    Perl: '#0298c3',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Clojure: '#db5855',
    Erlang: '#B83998',
    Julia: '#a270ba',
    OCaml: '#3be133',
    'Vim Script': '#199f4b',
    'Objective-C': '#438eff',
    CoffeeScript: '#244776',
    PowerShell: '#012456',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    Vue: '#41b883',
    Svelte: '#ff3e00',
    Astro: '#ff5a03',
    HCL: '#844FBA',
    Nix: '#7e7eff',
    Zig: '#ec915c',
    Dockerfile: '#384d54',
    Makefile: '#427819',
    TeX: '#3D6117',
    MATLAB: '#e16737',
    Jupyter: '#F37626',
    Assembly: '#6E4C13',
};

const FALLBACK_COLOR = '#8b8b8b';

/**
 * Calculate language statistics from raw byte counts.
 *
 * @param {Record<string, number>} languageBytes  e.g. { JavaScript: 50000, Python: 30000 }
 * @param {number} maxLangs                       Max languages to show (rest grouped as "Other")
 * @returns {Array<{ name: string, percentage: number, color: string }>}
 */
export function calculateStats(languageBytes, maxLangs = 8) {
    const entries = Object.entries(languageBytes);
    if (entries.length === 0) return [];

    const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
    if (totalBytes === 0) return [];

    // Sort descending by bytes
    const sorted = entries
        .map(([name, bytes]) => ({
            name,
            percentage: (bytes / totalBytes) * 100,
            color: LANGUAGE_COLORS[name] || FALLBACK_COLOR,
        }))
        .sort((a, b) => b.percentage - a.percentage);

    if (sorted.length <= maxLangs) {
        return sorted;
    }

    // Top N + "Other"
    const top = sorted.slice(0, maxLangs);
    const otherPercentage = sorted
        .slice(maxLangs)
        .reduce((sum, l) => sum + l.percentage, 0);

    if (otherPercentage > 0) {
        top.push({
            name: 'Other',
            percentage: otherPercentage,
            color: FALLBACK_COLOR,
        });
    }

    return top;
}
