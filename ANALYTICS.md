# Analytics (pixis.ink)

Stack: **Umami Cloud** (pageviews + custom events) + optional **Microsoft Clarity** (heatmaps / session replay).

## Activate (one-time, ~5 min)

### 1. Umami (required for “who / from where / what clicked”)

1. Sign up at [cloud.umami.is](https://cloud.umami.is)
2. **Add website** → domain `pixis.ink`
3. Copy the **Website ID** (UUID)
4. Paste into `analytics-config.js`:

```js
umamiWebsiteId: "YOUR-UUID-HERE",
```

5. Commit & push this repo (or open a PR)

Dashboard: traffic, referrers, countries, devices, custom events.

### 2. Microsoft Clarity (optional heatmaps)

1. [clarity.microsoft.com](https://clarity.microsoft.com) → New project → URL `https://pixis.ink`
2. Copy **Project ID**
3. Paste into `analytics-config.js` → `clarityId: "…"`
4. Commit & push

## What’s tracked

| Event | Where |
|-------|--------|
| Pageviews | All pages with the scripts (auto Umami) |
| `try_pixis` | Nav / hero / beta CTAs → `/app/` |
| `join_beta` | Hero → `#beta` |
| `beta_apply_submit` / `beta_apply_success` | Beta form |
| `sponsor` | GitHub Sponsors button |
| `discord` / `x` / `github` | Footer / nav |
| `feature_video` | Feature card demos |
| `gallery_open` | Gallery lightbox |
| `demo_open` | `/app/` load (injected by PixisEditor CI) |
| `beta_open` | `/beta/` load (injected by PixisEditor CI) |

Click events use `data-pixis-event` / `data-pixis-location` (not `data-track` — that attribute is used by image carousels).

## UTM (manual, for posts)

```
https://pixis.ink/?utm_source=discord&utm_medium=social&utm_campaign=launch
https://pixis.ink/?utm_source=x&utm_medium=social&utm_campaign=whats_new
```

## Privacy

See [privacy.html](./privacy.html). Until IDs are filled, no third-party analytics scripts load.
