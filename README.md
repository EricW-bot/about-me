# About me (portfolio)

Vanilla HTML, CSS, and JavaScript. The ambient background can reflect **live weather** and **local day/night** at the visitor’s location (via OpenWeatherMap), and you can choose **Auto**, **Day**, or **Night** appearance.

## OpenWeather (required for deployed weather)

1. Create a free API key at [OpenWeatherMap](https://openweathermap.org/api).
2. In the Netlify dashboard: **Site configuration → Environment variables → Add a variable**  
   - Key: `OPENWEATHER_API_KEY`  
   - Value: your key  
3. Deploy this site to **Netlify** so `/.netlify/functions/weather` is available.

The browser calls only the Netlify function; the key stays on the server. If you previously shared a key in chat or committed it anywhere, **rotate it** in the OpenWeather dashboard.

### Local development

```bash
npm i -g netlify-cli
netlify dev
```

Set `OPENWEATHER_API_KEY` in a root `.env` file (gitignored) or export it in your shell before `netlify dev`. Opening `index.html` directly from disk will not load weather (no function host).

## Appearance modes

- **Auto** — UI theme follows **local solar** day/night from the weather response when available; before that, uses your system light/dark preference.
- **Day** / **Night** — Locks the UI theme; the sky background still updates from weather when the API returns data.

Preference is stored in `localStorage` under `about-me-appearance-mode` (`auto` | `day` | `night`).
