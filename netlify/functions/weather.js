/**
 * Proxies OpenWeatherMap Current Weather API so the browser never sees the API key.
 * Set OPENWEATHER_API_KEY in Netlify (Site settings → Environment variables).
 *
 * Query: ?lat=-37.8&lon=144.9  OR  ?q=Melbourne,AU
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey =
    process.env.OPENWEATHER_API_KEY || process.env.OPEN_WEATHER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Server is missing OPENWEATHER_API_KEY (or OPEN_WEATHER_API_KEY)",
      }),
    };
  }

  const params = event.queryStringParameters || {};
  const lat = params.lat;
  const lon = params.lon;
  const q = params.q;

  let upstream;
  if (lat != null && lon != null && String(lat) !== "" && String(lon) !== "") {
    upstream =
      "https://api.openweathermap.org/data/2.5/weather?lat=" +
      encodeURIComponent(String(lat)) +
      "&lon=" +
      encodeURIComponent(String(lon)) +
      "&units=metric&appid=" +
      encodeURIComponent(apiKey);
  } else if (q != null && String(q).trim() !== "") {
    upstream =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      encodeURIComponent(String(q).trim()) +
      "&units=metric&appid=" +
      encodeURIComponent(apiKey);
  } else {
    return {
      statusCode: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Provide lat and lon, or q (city name)",
      }),
    };
  }

  try {
    const res = await fetch(upstream);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return {
        statusCode: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON from weather provider" }),
      };
    }
    return {
      statusCode: res.ok ? 200 : res.status,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Upstream request failed" }),
    };
  }
};
