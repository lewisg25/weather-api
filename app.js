const weatherButton = document.querySelector("#nav-weather");
const airButton = document.querySelector("#nav-air");
const title = document.querySelector("#view-title");
const statusMessage = document.querySelector("#status-message");
const content = document.querySelector("#content-display");
const locationName = "40.2415 N, 75.2838 W Lansdale PA";
let latestRequest = 0;


const weatherApi = CONFIG.WEATHER_API_URL;
const airQuality = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=40.2415&longitude=-75.2838&hourly=grass_pollen&current=grass_pollen"


const weatherUrl =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=40.2415&longitude=-75.2838` +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5";

const airQualityUrl =
  "https://air-quality-api.open-meteo.com/v1/air-quality" +
  `?latitude=40.2415&longitude=-75.2838` +
  "&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,uv_index&timezone=auto";

const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  95: "Thunderstorm",
};

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error-text", isError);
}

function setActiveNavigation(view) {
  const showingWeather = view === "weather";

  weatherButton.classList.toggle("active", showingWeather);
  airButton.classList.toggle("active", !showingWeather);
  weatherButton.setAttribute("aria-current", showingWeather ? "page" : "false");
  airButton.setAttribute("aria-current", showingWeather ? "false" : "page");
}

function getWeatherDescription(code) {
  return weatherDescriptions[code] || "Unknown conditions";
}

function getAqiDescription(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

function formatNumber(value, decimalPlaces = 0) {
  if (value === undefined || value === null) return "-";
  return Number(value).toFixed(decimalPlaces);
}

function formatDay(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function showWeather(data) {
  const current = data.current;
  const daily = data.daily;
  const currentUnits = data.current_units;
  const dailyUnits = data.daily_units;
  const windUnit =
    currentUnits.wind_speed_10m === "mp/h"
      ? "mph"
      : currentUnits.wind_speed_10m;

  title.innerHTML = `<h1>Weather forecast</h1><p>${locationName} | Updated ${
    current.time
  } ${data.timezone_abbreviation || ""}</p>`;

  const forecastRows = daily.time
    .map((date, index) => {
      return `
      <tr>
        <td>${formatDay(date)}</td>
        <td>${getWeatherDescription(daily.weather_code[index])}</td>
        <td>${formatNumber(daily.temperature_2m_max[index], 1)} ${
        dailyUnits.temperature_2m_max
      }</td>
        <td>${formatNumber(daily.temperature_2m_min[index], 1)} ${
        dailyUnits.temperature_2m_min
      }</td>
        <td>${formatNumber(daily.precipitation_probability_max[index])}${
        dailyUnits.precipitation_probability_max
      }</td>
      </tr>`;
    })
    .join("");

  content.innerHTML = `
    <section class="card current-weather">
      <div>
        <p class="eyebrow">Current conditions</p>
        <h2>${formatNumber(current.temperature_2m, 1)} ${
    currentUnits.temperature_2m
  }</h2>
        <p class="condition">${getWeatherDescription(current.weather_code)}</p>
      </div>
      <ul class="data-list">
        <li><strong>Feels like:</strong> ${formatNumber(
          current.apparent_temperature,
          1
        )} ${currentUnits.apparent_temperature}</li>
        <li><strong>Humidity:</strong> ${formatNumber(
          current.relative_humidity_2m
        )}${currentUnits.relative_humidity_2m}</li>
        <li><strong>Wind:</strong> ${formatNumber(
          current.wind_speed_10m,
          1
        )} ${windUnit}</li>
        <li><strong>Precipitation:</strong> ${formatNumber(
          current.precipitation,
          2
        )} ${currentUnits.precipitation}</li>
      </ul>
    </section>
    <section class="card">
      <h2>Five-day outlook</h2>
      <div class="table-scroll">
        <table class="forecast-table">
          <thead>
            <tr><th>Day</th><th>Conditions</th><th>High</th><th>Low</th><th>Rain chance</th></tr
          </thead>
          <tbody>${forecastRows}</tbody>
        </table>
      </div>
    </section>`;
}

function showAirQuality(data) {
  const current = data.current;
  const units = data.current_units;

  title.innerHTML = `<h1>Air quality</h1><p>${locationName} | Updated ${
    current.time
  } ${data.timezone_abbreviation || ""}</p>`;
  content.innerHTML = `
    <section class="card">
      <p class="eyebrow">Current US AQI</p>
      <div class="aqi-reading">
        <span class="aqi-value">${formatNumber(current.us_aqi)}</span>
        <span>${getAqiDescription(current.us_aqi)}</span>
      </div>
      <div class="metric-grid">
        <div class="metric"><span>PM2.5</span>${formatNumber(
          current.pm2_5,
          1
        )} ${units.pm2_5}</strong></div>
        <div class="metric"><span>PM10</span>${formatNumber(
          current.pm10,
          1
        )} ${units.pm10}</strong></div>
        <div class="metric"><span>Ozone</span>${formatNumber(
          current.ozone,
          1
        )} ${units.ozone}</div>
        <div class="metric"><span>Nitrogen dioxide</span>${formatNumber(
          current.nitrogen_dioxide,
          1
        )} ${units.nitrogen_dioxide}</div>
        <div class="metric"><span>UV index</span>${formatNumber(
          current.uv_index,
          1
        )}</strong></div>
      </div>
    </section>`;
}

async function loadView(view) {
  const requestNumber = ++latestRequest;
  const endpoint = view === "weather" ? weatherUrl : airQualityUrl;

  setActiveNavigation(view);
  content.innerHTML = "";
  showMessage(
    `Loading ${view === "weather" ? "weather forecast" : "air-quality data"}...`
  );

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.reason || "Open-Meteo could not return data right now."
      );
    }

    if (requestNumber !== latestRequest) return;

    if (view === "weather") {
      showWeather(data);
    } else {
      showAirQuality(data);
    }

    showMessage("");
  } catch (error) {
    if (requestNumber !== latestRequest) return;

    title.innerHTML = `<h1>${
      view === "weather" ? "Weather forecast" : "Air quality"
    }</h1>`
    showMessage(`Unable to load data. ${error.message}`, true);
  }
}

weatherButton.addEventListener("click", () => loadView("weather"));
airButton.addEventListener("click", () => loadView("air"));

loadView("weather");
