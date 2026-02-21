import https from 'node:https';

/**
 * Make an HTTPS GET request and return parsed JSON.
 * Returns { data, headers } on success; throws on HTTP errors.
 */
const ALLOWED_HOST = 'api.github.com';
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    // Validate the URL only points to GitHub API (prevents SSRF via crafted Link headers)
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error('Invalid URL'));
    }
    if (parsed.hostname !== ALLOWED_HOST || parsed.protocol !== 'https:') {
      return reject(new Error('Request blocked: URL does not point to api.github.com'));
    }

    const options = {
      headers: {
        'User-Agent': 'github-lang-card',
        Accept: 'application/vnd.github.v3+json',
      },
    };
    if (token) {
      options.headers.Authorization = `token ${token}`;
    }

    https
      .get(url, options, (res) => {
        let body = '';
        let bytes = 0;
        res.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > MAX_BODY_BYTES) {
            res.destroy();
            return reject(new Error('Response too large'));
          }
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 403) {
            const remaining = res.headers['x-ratelimit-remaining'];
            if (remaining === '0') {
              const err = new Error('GitHub API rate limit exceeded');
              err.code = 'RATE_LIMITED';
              return reject(err);
            }
          }

          if (res.statusCode === 404) {
            const err = new Error('GitHub user or resource not found');
            err.code = 'NOT_FOUND';
            return reject(err);
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`GitHub API returned HTTP ${res.statusCode}`);
            err.code = 'API_ERROR';
            return reject(err);
          }

          try {
            resolve({ data: JSON.parse(body), headers: res.headers });
          } catch (e) {
            reject(new Error('Failed to parse GitHub API response'));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Parse the "next" URL from the GitHub Link header for pagination.
 * Returns null when there are no more pages.
 */
function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

/**
 * Fetch every public repo for a user, handling pagination.
 */
const MAX_PAGES = 10; // Safety limit: 10 pages × 100 repos = 1000 repos max

async function fetchAllRepos(username, token) {
  let url = `https://api.github.com/users/${encodeURIComponent(
    username
  )}/repos?per_page=100&type=owner`;
  const repos = [];
  let page = 0;

  while (url && page < MAX_PAGES) {
    const { data, headers } = await httpGet(url, token);
    repos.push(...data);
    url = parseNextLink(headers.link || headers.Link || '');
    page++;
  }

  return repos;
}

/**
 * Fetch language byte counts for a single repo.
 */
async function fetchRepoLanguages(owner, repo, token) {
  const url = `https://api.github.com/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/languages`;
  const { data } = await httpGet(url, token);
  return data; // e.g. { JavaScript: 12345, Python: 6789 }
}

/**
 * Fetch and aggregate all language data for a GitHub user.
 *
 * @param {string} username  GitHub username
 * @param {string} [token]   GitHub PAT (optional but recommended)
 * @returns {Promise<Record<string, number>>}  Merged language byte counts
 */
export async function fetchLanguages(username, token) {
  const repos = await fetchAllRepos(username, token);

  if (repos.length === 0) {
    return {};
  }

  // Filter out forks to only count the user's own work
  const ownRepos = repos.filter((r) => !r.fork);

  // Fetch languages for all repos concurrently (batched to reduce pressure)
  const BATCH_SIZE = 10;
  const merged = {};

  for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
    const batch = ownRepos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((r) => fetchRepoLanguages(r.owner.login, r.name, token))
    );

    for (const langObj of results) {
      for (const [lang, bytes] of Object.entries(langObj)) {
        merged[lang] = (merged[lang] || 0) + bytes;
      }
    }
  }

  return merged;
}
