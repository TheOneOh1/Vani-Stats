# GitHub Language Stats Card

A serverless API that generates an SVG donut chart of your most-used programming languages across your GitHub profile. Built with pure Node.js, deployed on Vercel, and designed to be embedded directly in a GitHub README.

![Top Languages](https://vani-stats.vercel.app/api?username=TheOneOh1&theme=tokyonight)

---

## Features

- **Donut chart** with a visual breakdown of your top languages
- **Three themes** — `tokyonight`, `dark`, and `light`
- **Zero production dependencies** — only uses Node.js built-ins
- **GitHub-safe SVG** — fully inline styles, no external CSS, JS, or fonts
- **Hourly cache** — results refresh automatically every hour
- Languages beyond the configured limit are grouped into an **"Other"** bucket

---

## Themes

| Tokyo Night | Dark | Light |
|:-----------:|:----:|:-----:|
| ![tokyonight](https://vani-stats.vercel.app/api?username=TheOneOh1&theme=tokyonight) | ![dark](https://vani-stats.vercel.app/api?username=TheOneOh1&theme=dark) | ![light](https://vani-stats.vercel.app/api?username=TheOneOh1&theme=light) |

---

## Use It in Your Profile README

Add this to your GitHub profile `README.md`:

```markdown
![Top Languages](https://vani-stats.vercel.app/api?username=YOUR_GITHUB_USERNAME&theme=tokyonight)
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

### Query Parameters

| Parameter    | Required | Default      | Description                                  |
|-------------|----------|--------------|----------------------------------------------|
| `username`  | Yes      | —            | GitHub username                              |
| `theme`     | No       | `tokyonight` | Card theme: `tokyonight`, `dark`, or `light` |
| `max_langs` | No       | `8`          | Number of languages to display (1–20)        |

### Examples

```markdown
<!-- Default (tokyonight, 8 languages) -->
![Top Languages](https://vani-stats.vercel.app/api?username=TheOneOh1)

<!-- Dark theme, top 5 languages -->
![Top Languages](https://vani-stats.vercel.app/api?username=TheOneOh1&theme=dark&max_langs=5)

<!-- Light theme, centered -->
<p align="center">
  <img src="https://vani-stats.vercel.app/api?username=TheOneOh1&theme=light" alt="Top Languages" />
</p>
```

---

## License

MIT
