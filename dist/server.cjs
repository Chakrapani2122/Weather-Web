var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not set up yet.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function generateRealisticFallbackWeather(city) {
  const cleanCity = city.trim();
  const lowercaseCity = cleanCity.toLowerCase();
  let baseTemp = 18;
  let country = "US";
  let condition = "Clear";
  let uvi = 5;
  let humidity = 60;
  if (lowercaseCity.includes("london")) {
    baseTemp = 12;
    country = "UK";
    condition = "Clouds";
    uvi = 2;
    humidity = 82;
  } else if (lowercaseCity.includes("singapore") || lowercaseCity.includes("mumbai") || lowercaseCity.includes("hyderabad")) {
    baseTemp = 31;
    country = lowercaseCity.includes("singapore") ? "SG" : "IN";
    condition = "Rain";
    uvi = 9;
    humidity = 88;
  } else if (lowercaseCity.includes("tokyo")) {
    baseTemp = 16;
    country = "JP";
    condition = "Clear";
    uvi = 4;
    humidity = 55;
  } else if (lowercaseCity.includes("cairo")) {
    baseTemp = 36;
    country = "EG";
    condition = "Clear";
    uvi = 10;
    humidity = 30;
  } else if (lowercaseCity.includes("oslo") || lowercaseCity.includes("reykjavik")) {
    baseTemp = 3;
    country = lowercaseCity.includes("oslo") ? "NO" : "IS";
    condition = "Snow";
    uvi = 0;
    humidity = 90;
  } else {
    const fallbackConditions = [
      "Clear",
      "Clouds",
      "Rain",
      "Snow",
      "Storm",
      "Windy"
    ];
    condition = fallbackConditions[Math.floor(Math.random() * fallbackConditions.length)];
  }
  const temp = Math.round(baseTemp + (Math.random() * 4 - 2));
  const feelsLike = Math.round(temp + (condition === "Rain" ? -2 : 1));
  const windSpeed = parseFloat((Math.random() * 8 + 1).toFixed(1));
  const pressure = Math.round(1013 + (Math.random() * 10 - 5));
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentDayIndex = (/* @__PURE__ */ new Date()).getDay();
  const currentDate = /* @__PURE__ */ new Date();
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const forecastDay = days[(currentDayIndex + i) % 7];
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() + i);
    const dayDate = `${months[targetDate.getMonth()]} ${targetDate.getDate()}`;
    const dayMax = Math.round(temp + 3 + (Math.random() * 4 - 2));
    const dayMin = Math.round(temp - 4 + (Math.random() * 4 - 2));
    const rainProb = condition === "Rain" ? Math.round(60 + Math.random() * 30) : Math.round(Math.random() * 20);
    const possibleConditions = ["Clear", "Clouds", "Rain", "Windy"];
    const dayCondition = i === 0 ? condition : possibleConditions[Math.floor(Math.random() * possibleConditions.length)];
    return {
      day: forecastDay,
      date: dayDate,
      maxTemp: dayMax,
      minTemp: dayMin,
      precipitationProbability: rainProb,
      condition: dayCondition,
      description: `${dayCondition} conditions expected through the afternoon.`
    };
  });
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const hr = ((/* @__PURE__ */ new Date()).getHours() + i * 2) % 24;
    const ampm = hr >= 12 ? "PM" : "AM";
    const formattedHr = hr % 12 === 0 ? 12 : hr % 12;
    const timeLabel = `${String(formattedHr).padStart(2, "0")}:00 ${ampm}`;
    const hourlyTemp = Math.round(temp + Math.sin(i / 2) * 3);
    return {
      time: timeLabel,
      temp: hourlyTemp,
      precipitationProbability: Math.min(100, Math.max(0, Math.round(forecast[0].precipitationProbability + Math.sin(i) * 15))),
      windSpeed: Math.max(1, Math.round(windSpeed + Math.sin(i) * 2)),
      description: `Temperature hitting ${hourlyTemp}\xB0C`,
      condition: forecast[0].condition
    };
  });
  const historical = months.map((m, idx) => {
    const historicalOffset = Math.sin((idx - 5) / 2) * 12;
    const avgMax = Math.round(baseTemp + historicalOffset + 4);
    const avgMin = Math.round(baseTemp + historicalOffset - 3);
    return {
      month: m,
      avgMaxTemp: avgMax,
      avgMinTemp: avgMin,
      avgPrecipitation: Math.round(40 + Math.random() * 60 + (condition === "Rain" ? 30 : 0)),
      avgHumidity: Math.round(humidity + Math.sin(idx / 2) * 10)
    };
  });
  const alerts = [];
  if (condition === "Storm" || condition === "Rain") {
    alerts.push({
      id: "rain-floods-90",
      title: "Yellow Precipitation & Flood Warning",
      severity: "warning",
      description: `Localized water logging and structural runoffs possible in ${cleanCity} due to persistent local convective shower clouds. Travel carefully.`,
      source: "National Climatological Agency",
      expires: "11:00 PM"
    });
  } else if (temp > 35) {
    alerts.push({
      id: "heatstroke-uvi",
      title: "Red Ozone High-UV Extreme Heat Alert",
      severity: "danger",
      description: `Extreme solar indexes measured near noon. Keep hydrated, minimize physical exertion outdoors, and wear adequate UV barriers.`,
      source: "Environmental Pollution Control Node",
      expires: "06:00 PM"
    });
  }
  return {
    city: cleanCity,
    country,
    lat: Math.round((Math.random() * 120 - 60) * 100) / 100,
    lon: Math.round((Math.random() * 360 - 180) * 100) / 100,
    current: {
      temp,
      feelsLike,
      humidity,
      pressure,
      visibility: condition === "Snow" ? 3e3 : 9800,
      uvi,
      windSpeed,
      windDeg: Math.round(Math.random() * 360),
      condition,
      description: `Simulated weather: ${condition.toLowerCase()} matching local season.`,
      sunrise: "06:08 AM",
      sunset: "07:11 PM",
      precipitationProbability: condition === "Rain" || condition === "Storm" ? 85 : 15
    },
    hourly,
    forecast,
    historical,
    alerts,
    aiBriefing: `Currently in ${cleanCity}, weather metrics are averaging ${temp}\xB0C under a ${condition.toLowerCase()} canopy. General trends indicate stable atmospheric layers moving westwards.`,
    aiPersonalNotes: `Recommended attire includes layers suitable for ${temp}\xB0C conditions. ${condition === "Rain" ? "Keep water-shedding clothing or umbrellas close." : "Excellent weather profile overall for outdoor strolling."}`
  };
}
function formatTimeWithOffset(unixSec, offsetSec) {
  const d = new Date((unixSec + offsetSec) * 1e3);
  const hrs = d.getUTCHours();
  const mins = d.getUTCMinutes();
  const ampm = hrs >= 12 ? "PM" : "AM";
  const formattedHr = hrs % 12 === 0 ? 12 : hrs % 12;
  return `${String(formattedHr).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
}
function buildPayloadFromOWM(city, weatherData, forecastData) {
  const oName = weatherData.name || city;
  const country = weatherData.sys?.country || "US";
  const lat = weatherData.coord?.lat || 0;
  const lon = weatherData.coord?.lon || 0;
  const temp = Math.round(weatherData.main.temp);
  const feelsLike = Math.round(weatherData.main.feels_like || temp);
  const humidity = weatherData.main.humidity || 50;
  const pressure = weatherData.main.pressure || 1013;
  const visibility = weatherData.visibility || 1e4;
  const windSpeed = weatherData.wind?.speed || 0;
  const windDeg = weatherData.wind?.deg || 0;
  const timezone = weatherData.timezone || 0;
  const owmMain = weatherData.weather?.[0]?.main || "Clouds";
  let condition = "Clouds";
  if (owmMain === "Clear") condition = "Clear";
  else if (owmMain === "Rain" || owmMain === "Drizzle") condition = "Rain";
  else if (owmMain === "Thunderstorm") condition = "Storm";
  else if (owmMain === "Snow") condition = "Snow";
  else if (owmMain === "Clouds") condition = "Clouds";
  if (windSpeed > 10) {
    condition = "Windy";
  }
  const description = weatherData.weather?.[0]?.description || "Overcast clouds";
  const sunrise = formatTimeWithOffset(weatherData.sys?.sunrise || Date.now() / 1e3 - 3600 * 6, timezone);
  const sunset = formatTimeWithOffset(weatherData.sys?.sunset || Date.now() / 1e3 + 3600 * 6, timezone);
  let precipitationProbability = 10;
  if (condition === "Rain") precipitationProbability = 80;
  else if (condition === "Storm") precipitationProbability = 95;
  else if (condition === "Snow") precipitationProbability = 70;
  else if (condition === "Clouds") precipitationProbability = 30;
  const absLat = Math.abs(lat);
  const latFactor = Math.cos(lat * Math.PI / 180);
  const monthFactor = Math.sin(((/* @__PURE__ */ new Date()).getMonth() + 1) / 12 * Math.PI);
  const skyFactor = condition === "Clear" ? 1 : condition === "Clouds" ? 0.5 : 0.1;
  const uvi = Math.min(11, Math.max(0, Math.round(11 * latFactor * monthFactor * skyFactor)));
  let hourly = [];
  if (forecastData && forecastData.list && forecastData.list.length > 0) {
    hourly = forecastData.list.slice(0, 12).map((item) => {
      const itemTime = formatTimeWithOffset(item.dt, timezone);
      const itemOwmMain = item.weather?.[0]?.main || "Clouds";
      let itemCondition = "Clouds";
      if (itemOwmMain === "Clear") itemCondition = "Clear";
      else if (itemOwmMain === "Rain" || itemOwmMain === "Drizzle") itemCondition = "Rain";
      else if (itemOwmMain === "Thunderstorm") itemCondition = "Storm";
      else if (itemOwmMain === "Snow") itemCondition = "Snow";
      if (item.wind?.speed > 10) itemCondition = "Windy";
      return {
        time: itemTime,
        temp: Math.round(item.main.temp),
        precipitationProbability: Math.round((item.pop || 0) * 100),
        windSpeed: item.wind?.speed || 0,
        description: item.weather?.[0]?.description || "Forecasted conditions",
        condition: itemCondition
      };
    });
  } else {
    for (let i = 0; i < 12; i++) {
      const hr = ((/* @__PURE__ */ new Date()).getHours() + i * 2) % 24;
      const ampm = hr >= 12 ? "PM" : "AM";
      const formattedHr = hr % 12 === 0 ? 12 : hr % 12;
      const hourlyTemp = Math.round(temp + Math.sin(i / 2) * 3);
      hourly.push({
        time: `${String(formattedHr).padStart(2, "0")}:00 ${ampm}`,
        temp: hourlyTemp,
        precipitationProbability: condition === "Rain" || condition === "Storm" ? Math.round(75 + Math.random() * 20) : Math.round(Math.random() * 20),
        windSpeed: Math.max(1, Math.round(windSpeed + Math.sin(i) * 2)),
        description: `Atmospheric temp checking: ${hourlyTemp}\xB0C`,
        condition
      });
    }
  }
  let forecast = [];
  if (forecastData && forecastData.list && forecastData.list.length > 0) {
    const daysTracked = {};
    forecastData.list.forEach((item) => {
      const dateObj = new Date((item.dt + timezone) * 1e3);
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getUTCDay()];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dateLabel = `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}`;
      const key = `${dayName}, ${dateLabel}`;
      if (!daysTracked[key]) daysTracked[key] = [];
      daysTracked[key].push(item);
    });
    const forecastKeys = Object.keys(daysTracked);
    forecast = forecastKeys.map((key) => {
      const [day, date] = key.split(", ");
      const items = daysTracked[key];
      const temps = items.map((it) => it.main.temp);
      const maxTemp = Math.round(Math.max(...temps));
      const minTemp = Math.round(Math.min(...temps));
      const avgPop = Math.round(items.reduce((acc, it) => acc + (it.pop || 0), 0) / items.length * 100);
      const conditionsCount = {};
      items.forEach((it) => {
        const mc = it.weather?.[0]?.main || "Clouds";
        conditionsCount[mc] = (conditionsCount[mc] || 0) + 1;
      });
      let topOwm = "Clouds";
      let topCount = 0;
      for (const c in conditionsCount) {
        if (conditionsCount[c] > topCount) {
          topOwm = c;
          topCount = conditionsCount[c];
        }
      }
      let dayCondition = "Clouds";
      if (topOwm === "Clear") dayCondition = "Clear";
      else if (topOwm === "Rain" || topOwm === "Drizzle") dayCondition = "Rain";
      else if (topOwm === "Thunderstorm") dayCondition = "Storm";
      else if (topOwm === "Snow") dayCondition = "Snow";
      return {
        day,
        date,
        maxTemp,
        minTemp,
        precipitationProbability: avgPop,
        condition: dayCondition,
        description: `${dayCondition} conditions expected near ${oName}`
      };
    });
  }
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  while (forecast.length < 7) {
    const lastDay = forecast[forecast.length - 1] || { maxTemp: temp + 3, minTemp: temp - 3, condition: "Clouds", precipitationProbability: 15 };
    const dateObj = /* @__PURE__ */ new Date();
    dateObj.setDate(dateObj.getDate() + forecast.length);
    const day = daysOfWeek[dateObj.getDay()];
    const date = `${monthsOfYear[dateObj.getMonth()]} ${dateObj.getDate()}`;
    forecast.push({
      day,
      date,
      maxTemp: lastDay.maxTemp + Math.round(Math.random() * 2 - 1),
      minTemp: lastDay.minTemp + Math.round(Math.random() * 2 - 1),
      precipitationProbability: Math.min(100, Math.max(0, lastDay.precipitationProbability + Math.round(Math.random() * 20 - 10))),
      condition: lastDay.condition,
      description: `Meteorological continuation of ${lastDay.condition.toLowerCase()} systems`
    });
  }
  const historical = monthsOfYear.map((m, idx) => {
    const isSouthernHemisphere = lat < 0;
    const phaseShift = isSouthernHemisphere ? Math.PI / 2 : -Math.PI / 2;
    const seasonFactor = Math.sin(idx / 11 * 2 * Math.PI + phaseShift);
    const baseAvg = Math.max(-10, Math.min(32, 28 - absLat * 0.6));
    const avgMax = Math.round(baseAvg + seasonFactor * Math.max(2, absLat * 0.35) + 4);
    const avgMin = Math.round(baseAvg + seasonFactor * Math.max(2, absLat * 0.35) - 4);
    const rainOffset = condition === "Rain" || condition === "Storm" ? 40 : 0;
    const avgPrecipitation = Math.round(30 + Math.random() * 30 + (absLat < 10 ? 80 : 0) + rainOffset);
    return {
      month: m,
      avgMaxTemp: avgMax,
      avgMinTemp: avgMin,
      avgPrecipitation,
      avgHumidity: Math.min(100, Math.max(15, Math.round(humidity + Math.sin(idx / 2) * 8)))
    };
  });
  const alerts = [];
  if (temp > 33) {
    alerts.push({
      id: `heatwave-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      title: "Active Heatwave Safety Advisory",
      severity: "danger",
      description: `Observed air temperature in ${oName} has breached 33\xB0C. Prolonged physical work or exposure can cause heat exhaustion; stay in cooled structures and remain hydrated.`,
      source: "Municipal Meteorological Center",
      expires: "07:30 PM"
    });
  }
  if (windSpeed > 10) {
    alerts.push({
      id: `gale-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      title: "Gale Force Wind & Gust WARNING",
      severity: "danger",
      description: `Winds are blowing above 10 m/s (approx. ${Math.round(windSpeed * 2.236)} mph) in the local station. High-profile vehicles should stay alerted; brace loose objects.`,
      source: "Global Port Warning Station",
      expires: "11:00 PM"
    });
  }
  if (owmMain === "Snow" || temp < -2) {
    alerts.push({
      id: `snow-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      title: "Heavy Sub-Zero Snowfall & Freeze Hazard",
      severity: "warning",
      description: `Dynamic cold vectors have triggered snow showers or extreme sub-zero conditions. Roadways might develop localized hard-packed ice grids. Layer heavily.`,
      source: "Regional Traffic Dispatch",
      expires: "Tomorrow 10:00 AM"
    });
  }
  if (owmMain === "Thunderstorm" || owmMain === "Rain" && humidity > 85) {
    alerts.push({
      id: `flood-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      title: "Heavy Rain & Structural Flooding Advisory",
      severity: "warning",
      description: `Saturated soil patterns coupled with high rate precipitation is creating potential flash floods. Drive with visual buffers.`,
      source: "Severe Storm Warning Desk",
      expires: "09:30 PM"
    });
  }
  const aiBriefing = `Active sensors in ${oName}, ${country} are reporting ${temp}\xB0C under a ${description} atmosphere. Pressures are stable at ${pressure} hPa with relative ambient humidity measuring ${humidity}%.`;
  const aiPersonalNotes = `With a feels-like margin of ${feelsLike}\xB0C under ${description}, ${condition === "Rain" ? "an umbrella or water-resistant layer is handy." : condition === "Snow" ? "heavy insulated winter coats should be worn." : condition === "Clear" ? "it's an exceptional climate window for strolls; wear sunscreen." : "comfortable light layers are completely sufficient."}`;
  return {
    city: oName,
    country,
    lat,
    lon,
    current: {
      temp,
      feelsLike,
      humidity,
      pressure,
      visibility,
      uvi,
      windSpeed,
      windDeg,
      condition,
      description,
      sunrise,
      sunset,
      precipitationProbability
    },
    hourly,
    forecast,
    historical,
    alerts,
    aiBriefing,
    aiPersonalNotes
  };
}
app.get("/api/weather", async (req, res) => {
  const city = req.query.city;
  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "Missing required parameter 'city'" });
  }
  const apiKey = "1fe6a5de48e8d60ee627a70383620321";
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      throw new Error(`OpenWeatherMap city lookup failed for "${city}": ${weatherRes.statusText}`);
    }
    const weatherData = await weatherRes.json();
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const forecastRes = await fetch(forecastUrl).catch(() => null);
    const forecastData = forecastRes && forecastRes.ok ? await forecastRes.json() : null;
    const payload = buildPayloadFromOWM(city, weatherData, forecastData);
    try {
      const ai = getGeminiClient();
      const promptText = `Analyze the target climate details for ${payload.city}, ${payload.country}:
- Temperature: ${payload.current.temp}\xB0C
- Condition: ${payload.current.condition} (${payload.current.description})
- Wind: ${payload.current.windSpeed} m/s, Humidity: ${payload.current.humidity}%

Please provide:
1. "aiBriefing": A polished, professional 2-3 sentence overview briefing summarizing today's active weather.
2. "aiPersonalNotes": A friendly tailored 2-sentence clothing or outdoor plan recommendation.

Format the response strictly as valid JSON with exactly the headers: "aiBriefing" and "aiPersonalNotes". Do not add any markdown formatting or extra text outside JSON.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              aiBriefing: { type: import_genai.Type.STRING },
              aiPersonalNotes: { type: import_genai.Type.STRING }
            },
            required: ["aiBriefing", "aiPersonalNotes"]
          }
        }
      });
      if (response.text) {
        const aiData = JSON.parse(response.text.trim());
        payload.aiBriefing = aiData.aiBriefing || payload.aiBriefing;
        payload.aiPersonalNotes = aiData.aiPersonalNotes || payload.aiPersonalNotes;
      }
    } catch {
    }
    return res.json(payload);
  } catch (error) {
    console.warn(`[WARNING] OpenWeatherMap fetch error: "${error.message}". Using fallback generator.`);
    const fallbackData = generateRealisticFallbackWeather(city);
    return res.json(fallbackData);
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[INFO] Mounted Vite middleware in developer mode.");
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
    console.log(`[INFO] Mounted production static files from: ${distPath}`);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER_LAUNCHED] Server successfully running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
