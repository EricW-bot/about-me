# About me (portfolio)

Vanilla HTML, CSS, and JavaScript with **Auto**, **Day**, and **Night** appearance.

## OpenWeather (for Auto mode on Netlify)

**Auto** picks day or night using `sunrise <= now_utc < sunset` from OpenWeather’s `sys` fields for the visitor’s location (or Melbourne if geolocation is denied).

1. Create a free API key at [OpenWeatherMap](https://openweathermap.org/api).
2. In Netlify: **Site configuration → Environment variables**  
   - Key: `OPENWEATHER_API_KEY`  
   - Value: your key  
3. Deploy so `/.netlify/functions/weather` is available.

The browser never sees the API key. Rotate any key that was ever committed or shared.

### Local development

```bash
npm i -g netlify-cli
netlify dev
```

Set `OPENWEATHER_API_KEY` in a root `.env` file (gitignored).

### Why `file://` shows CORS errors

If you double-click `index.html`, the page loads as `file://…` with origin `null`. The script requests `/.netlify/functions/weather`, which the browser resolves as `file:///.netlify/functions/weather` — not a real server. Browsers only allow `fetch` over **http** or **https**, so you see a CORS / `ERR_FAILED` message. **Auto** then falls back to your system light/dark preference until you use `netlify dev` or deploy to Netlify.

## Appearance modes

- **Auto** — Day/night from sunrise/sunset when weather loads; otherwise your system light/dark preference.
- **Day** / **Night** — Locks the UI theme.

Stored in `localStorage` as `about-me-appearance-mode` (`auto` | `day` | `night`).
