/**
 * Appearance: auto | day | night (localStorage `about-me-appearance-mode`)
 * - Auto: sunrise <= now_utc < sunset from OpenWeather (via Netlify proxy).
 *   Until weather loads, uses prefers-color-scheme. Migrates legacy `about-me-theme`.
 */
(function () {
  "use strict";

  var STORAGE_MODE = "about-me-appearance-mode";
  var MODE_AUTO = "auto";
  var MODE_DAY = "day";
  var MODE_NIGHT = "night";
  var THEME_DAY = "day";
  var THEME_NIGHT = "night";
  var LEGACY_THEME_KEY = "about-me-theme";
  var FALLBACK_CITY = "Melbourne,AU";
  var WEATHER_PATH = "/.netlify/functions/weather";

  var state = {
    mode: MODE_AUTO,
    lastWeather: null,
  };

  function getSystemTheme() {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return THEME_NIGHT;
    }
    return THEME_DAY;
  }

  function getStoredMode() {
    try {
      var m = localStorage.getItem(STORAGE_MODE);
      if (m === MODE_AUTO || m === MODE_DAY || m === MODE_NIGHT) return m;
      var legacy = localStorage.getItem(LEGACY_THEME_KEY);
      if (legacy === THEME_NIGHT) return MODE_NIGHT;
      if (legacy === THEME_DAY) return MODE_DAY;
    } catch (_) {}
    return MODE_AUTO;
  }

  function persistMode(mode) {
    try {
      localStorage.setItem(STORAGE_MODE, mode);
      localStorage.removeItem(LEGACY_THEME_KEY);
    } catch (_) {}
  }

  function applyHtmlTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function isDaytime(sunrise, sunset) {
    if (sunrise == null || sunset == null) return null;
    var nowSec = Math.floor(Date.now() / 1000);
    return sunrise <= nowSec && nowSec < sunset;
  }

  function resolveEffectiveTheme() {
    if (state.mode === MODE_DAY) return THEME_DAY;
    if (state.mode === MODE_NIGHT) return THEME_NIGHT;
    var w = state.lastWeather;
    if (w && w.sys) {
      var daytime = isDaytime(w.sys.sunrise, w.sys.sunset);
      if (daytime === true) return THEME_DAY;
      if (daytime === false) return THEME_NIGHT;
    }
    return getSystemTheme();
  }

  function applyEffectiveTheme() {
    applyHtmlTheme(resolveEffectiveTheme());
  }

  function syncRadios() {
    var radios = document.querySelectorAll('input[name="appearance"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = radios[i].value === state.mode;
    }
  }

  function initAppearanceRadios() {
    var fieldset = document.getElementById("appearance-radiogroup");
    if (!fieldset) return;
    fieldset.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || t.name !== "appearance") return;
      state.mode = t.value;
      persistMode(state.mode);
      applyEffectiveTheme();
    });
  }

  function fetchWeather(queryString) {
    var url = WEATHER_PATH + "?" + queryString;
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("weather " + res.status);
      return res.json();
    });
  }

  function isWeatherSuccess(w) {
    if (!w || typeof w !== "object") return false;
    var c = w.cod;
    return c === 200 || c === "200";
  }

  function handleWeatherData(w) {
    if (!isWeatherSuccess(w)) {
      throw new Error(w && w.message ? String(w.message) : "weather error");
    }
    state.lastWeather = w;
    if (state.mode === MODE_AUTO) applyEffectiveTheme();
  }

  function handleWeatherError() {
    state.lastWeather = null;
    if (state.mode === MODE_AUTO) applyEffectiveTheme();
  }

  function loadWeatherWithLatLon(lat, lon) {
    return fetchWeather(
      "lat=" +
        encodeURIComponent(String(lat)) +
        "&lon=" +
        encodeURIComponent(String(lon))
    ).then(handleWeatherData);
  }

  function loadWeatherFallbackCity() {
    return fetchWeather("q=" + encodeURIComponent(FALLBACK_CITY)).then(
      handleWeatherData
    );
  }

  function startWeather() {
    if (typeof fetch !== "function") {
      handleWeatherError();
      return Promise.resolve();
    }

    if (!navigator.geolocation) {
      return loadWeatherFallbackCity().catch(handleWeatherError);
    }

    return new Promise(function (resolve) {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve(
            loadWeatherWithLatLon(
              pos.coords.latitude,
              pos.coords.longitude
            ).catch(function () {
              return loadWeatherFallbackCity().catch(handleWeatherError);
            })
          );
        },
        function () {
          resolve(loadWeatherFallbackCity().catch(handleWeatherError));
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    });
  }

  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function initReveal() {
    if (prefersReducedMotion()) return;
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length || typeof IntersectionObserver === "undefined") {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.add("is-visible");
      }
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach(function (n) {
      observer.observe(n);
    });
  }

  function boot() {
    state.mode = getStoredMode();
    syncRadios();
    applyEffectiveTheme();
    initAppearanceRadios();
    initYear();
    initReveal();
    startWeather();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
