/**
 * Theme definitions — bg, border, title text, body text colors.
 */
const THEMES = {
    tokyonight: {
        bg: '#1a1b27',
        border: '#38bdae',
        title: '#70a5fd',
        text: '#a9b1d6',
        subtitle: '#38bdae',
    },
    dark: {
        bg: '#0d1117',
        border: '#30363d',
        title: '#58a6ff',
        text: '#c9d1d9',
        subtitle: '#8b949e',
    },
    light: {
        bg: '#ffffff',
        border: '#d0d7de',
        title: '#0969da',
        text: '#1f2328',
        subtitle: '#656d76',
    },
};

const FONT_FAMILY =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Compute an SVG arc path segment for a donut chart slice.
 *
 * @param {number} cx        Center X
 * @param {number} cy        Center Y
 * @param {number} r         Outer radius
 * @param {number} ir        Inner radius (donut hole)
 * @param {number} startDeg  Start angle in degrees (0 = top)
 * @param {number} endDeg    End angle in degrees
 * @returns {string}         SVG path `d` attribute
 */
function describeArc(cx, cy, r, ir, startDeg, endDeg) {
    // Clamp to avoid full-circle rendering glitch
    const span = Math.min(endDeg - startDeg, 359.999);
    const endClamped = startDeg + span;

    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

    const outerStart = {
        x: cx + r * Math.cos(toRad(startDeg)),
        y: cy + r * Math.sin(toRad(startDeg)),
    };
    const outerEnd = {
        x: cx + r * Math.cos(toRad(endClamped)),
        y: cy + r * Math.sin(toRad(endClamped)),
    };
    const innerEnd = {
        x: cx + ir * Math.cos(toRad(endClamped)),
        y: cy + ir * Math.sin(toRad(endClamped)),
    };
    const innerStart = {
        x: cx + ir * Math.cos(toRad(startDeg)),
        y: cy + ir * Math.sin(toRad(startDeg)),
    };

    const largeArc = span > 180 ? 1 : 0;

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${ir} ${ir} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        `Z`,
    ].join(' ');
}

/**
 * Generate a complete, self-contained SVG string.
 *
 * @param {Array<{ name: string, percentage: number, color: string }>} stats
 * @param {string} themeName
 * @returns {string}  SVG markup
 */
export function generateSVG(stats, themeName = 'tokyonight') {
    const theme = THEMES[themeName] || THEMES.tokyonight;

    // ── Dimensions ──
    const cardWidth = 450;
    const padding = 25;
    const titleHeight = 35;
    const donutCX = 120;
    const donutCY = 130;
    const outerR = 70;
    const innerR = 42;
    const legendX = 230;
    const legendStartY = 65;
    const legendRowHeight = 28;
    const legendDotR = 5;

    // Card height adapts to legend length
    const legendRows = stats.length || 1;
    const cardHeight = Math.max(
        donutCY + outerR + padding + 10,
        legendStartY + legendRows * legendRowHeight + padding
    );

    // ── Build donut slices ──
    let currentAngle = 0;
    const slices = stats.map((lang) => {
        const sliceDeg = (lang.percentage / 100) * 360;
        const path = describeArc(donutCX, donutCY, outerR, innerR, currentAngle, currentAngle + sliceDeg);
        currentAngle += sliceDeg;
        return `<path d="${path}" fill="${lang.color}" stroke="${theme.bg}" stroke-width="1.5"/>`;
    });

    // If only one language, draw a full ring instead of an arc
    if (stats.length === 1) {
        const lang = stats[0];
        slices.length = 0;
        slices.push(
            `<circle cx="${donutCX}" cy="${donutCY}" r="${outerR}" fill="${lang.color}"/>`,
            `<circle cx="${donutCX}" cy="${donutCY}" r="${innerR}" fill="${theme.bg}"/>`
        );
    }

    // ── Build legend rows ──
    const legendItems = stats.map((lang, i) => {
        const y = legendStartY + i * legendRowHeight;
        const pct = lang.percentage.toFixed(1);
        return [
            `<circle cx="${legendX}" cy="${y}" r="${legendDotR}" fill="${lang.color}"/>`,
            `<text x="${legendX + 14}" y="${y + 4}" fill="${theme.text}" font-size="12" font-family="${FONT_FAMILY}" font-weight="400">${escapeXml(lang.name)}</text>`,
            `<text x="${cardWidth - padding}" y="${y + 4}" fill="${theme.subtitle}" font-size="11" font-family="${FONT_FAMILY}" font-weight="400" text-anchor="end">${pct}%</text>`,
        ].join('\n      ');
    });

    // ── Percentage label in center of donut ──
    const topLang = stats.length > 0 ? stats[0] : null;
    const centerLabel = topLang
        ? [
            `<text x="${donutCX}" y="${donutCY - 4}" text-anchor="middle" fill="${theme.text}" font-size="15" font-family="${FONT_FAMILY}" font-weight="700">${topLang.percentage.toFixed(1)}%</text>`,
            `<text x="${donutCX}" y="${donutCY + 14}" text-anchor="middle" fill="${theme.subtitle}" font-size="10" font-family="${FONT_FAMILY}" font-weight="400">${escapeXml(topLang.name)}</text>`,
        ].join('\n    ')
        : '';

    // ── Assemble SVG ──
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none">
  <rect x="0.5" y="0.5" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="10" ry="10" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1" stroke-opacity="0.7"/>

  <text x="${padding}" y="${padding + 14}" fill="${theme.title}" font-size="16" font-family="${FONT_FAMILY}" font-weight="700">Top Languages</text>

  <g>
    ${slices.join('\n    ')}
    ${centerLabel}
  </g>

  <g>
    ${legendItems.join('\n    ')}
  </g>
</svg>`;
}

/**
 * Generate a fallback error SVG card.
 */
export function generateErrorSVG(message, themeName = 'tokyonight') {
    const theme = THEMES[themeName] || THEMES.tokyonight;
    const cardWidth = 450;
    const cardHeight = 120;
    const padding = 25;

    // Word-wrap the message into lines of ~50 chars
    const words = message.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > 50) {
            lines.push(current.trim());
            current = word;
        } else {
            current += ' ' + word;
        }
    }
    if (current.trim()) lines.push(current.trim());

    const textLines = lines
        .map(
            (line, i) =>
                `<text x="${padding}" y="${padding + 50 + i * 20}" fill="${theme.text}" font-size="12" font-family="${FONT_FAMILY}" font-weight="400">${escapeXml(line)}</text>`
        )
        .join('\n  ');

    const height = Math.max(cardHeight, padding + 50 + lines.length * 20 + padding);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${height}" viewBox="0 0 ${cardWidth} ${height}" fill="none">
  <rect x="0.5" y="0.5" width="${cardWidth - 1}" height="${height - 1}" rx="10" ry="10" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1" stroke-opacity="0.7"/>
  <text x="${padding}" y="${padding + 14}" fill="${theme.title}" font-size="16" font-family="${FONT_FAMILY}" font-weight="700">Top Languages</text>
  <text x="${padding}" y="${padding + 34}" fill="#e5534b" font-size="13" font-family="${FONT_FAMILY}" font-weight="600">⚠ Error</text>
  ${textLines}
</svg>`;
}

/** Escape XML special characters to prevent injection. */
function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
