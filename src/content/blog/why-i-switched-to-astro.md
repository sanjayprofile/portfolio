---
title: "Why I Switched from React to Astro (And Never Looked Back)"
description: "A deep dive into my journey from React to Astro — what I gained, what I lost, and why performance-first thinking changed how I build for the web."
publishedAt: 2026-09-10
tags: ["Astro", "React", "Performance", "Web Dev"]
---

After three years building production apps in React, I made a bet: I'd rebuild my portfolio in Astro and measure the difference. The results surprised me more than I expected.

## The React Trap

React is a phenomenal library. I've shipped dozens of apps with it, and I'd recommend it for complex, interactive UIs. But somewhere along the way, I started using it for *everything* — including sites that were mostly static content.

The result? Sending 300KB of JavaScript to render a blog post that changes twice a month.

```bash
# Typical React blog bundle
main.js        287 KB (gzipped: 92 KB)
chunk.vendor.js 189 KB (gzipped: 58 KB)
# Total: ~150 KB over the wire for a static page
```

This isn't React's fault. It's mine for reaching for the wrong tool.

## Enter Astro

Astro's core promise is deceptively simple: **ship zero JavaScript by default**. Render everything at build time, and only hydrate the components that actually need interactivity.

```astro
---
// This component ships ZERO client-side JS
const data = await fetch('https://api.example.com/data').then(r => r.json());
---

<ul>
  {data.map(item => <li>{item.name}</li>)}
</ul>
```

The first time I ran Lighthouse on my Astro portfolio, I blinked at the screen: **99 performance score**, on mobile, without any optimization tricks.

## The Island Architecture

Astro's "Islands" concept lets you be surgical about hydration. Need a search bar? Hydrate it. Navigation dropdowns? Sure. A button counter? Absolutely. The blog post content itself? Not a single byte.

```astro
---
import SearchBar from '../components/SearchBar.tsx';
import StaticNav from '../components/StaticNav.astro';
---

<!-- Ships zero JS -->
<StaticNav />

<!-- Hydrates only when visible -->
<SearchBar client:visible />
```

This mental model forced me to think: *does this component actually need JavaScript?* More often than not, the answer is no.

## What I Actually Missed

Honestly? Not much. Here's my honest scorecard after six months:

| Feature | React | Astro |
|---|---|---|
| Component model | Excellent | Very good |
| DX | Great | Great |
| Performance | Good | Excellent |
| Build times | Slow | Fast |
| Learning curve | Medium | Low |

The one area where React still wins: highly interactive UIs with complex state. But for content-heavy sites — portfolios, blogs, documentation — Astro is the better tool.

## Making the Switch

If you're considering the switch, here's my practical advice:

1. **Start with a new project** — don't try to migrate an existing React app
2. **Embrace `.astro` files** — they're just enhanced HTML with superpowers
3. **Use framework components when needed** — Astro supports React, Vue, Svelte, and more via islands
4. **Think at build time first** — if data doesn't change per-user, fetch it at build time

## Conclusion

Astro didn't make me a better developer. But it made me think more carefully about what JavaScript is actually *for*. That clarity has made all my projects — React included — leaner and faster.

If you're building anything content-forward, give Astro 20 minutes. You might not go back.
