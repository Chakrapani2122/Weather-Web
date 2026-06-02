# Weather Web App 🌦️

A modern, feature-rich weather application built with React, TypeScript, and Firebase. Get real-time weather data, forecasts, and historical climate information.

## Features ✨

- **Real-time Weather Data**: Current weather conditions with detailed metrics
- **7-Day Forecast**: Extended weather predictions with temperature ranges
- **Hourly Forecast**: Hour-by-hour weather updates
- **Historical Climate Data**: 12-month climatology charts and trends
- **Weather Alerts**: Real-time severe weather notifications
- **Customizable Dashboard**: Toggle widgets on/off based on your preferences
- **Firebase Authentication**: Google Sign-In with cloud sync
- **User Profile**: Manage saved cities and switch between locations
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile
- **Dark Mode**: Adaptive UI with automatic weather-based themes

## Tech Stack 🛠️

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend**: Express.js, Node.js
- **API**: OpenWeatherMap API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Sign-In)
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started 🚀

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- OpenWeatherMap API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Weather-Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   The Firebase configuration is already set up in `firebase-applet-config.json`. If you need to use your own Firebase project:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database and Authentication (Google Sign-In)
   - Copy your Firebase config to `firebase-applet-config.json`

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Usage 📱

### User Profile
- Click the Profile button in the top-right corner
- Add new cities to your saved locations
- Switch between saved cities with one click
- Remove cities you no longer need

### Search for Cities
- Use the search bar to find weather for any city worldwide
- Save your favorite cities for quick access
- Locations sync across devices when signed in

### Customize Your Dashboard
- Click the settings icon (⚙️) in the bottom-right corner
- Toggle individual widgets on/off:
  - Hourly Forecast
  - 7-Day Forecast
  - Historical Charts
  - Humidity & Pressure
  - Wind Conditions
  - Sun & UV Index
  - Weather Insights
  - Real-Time Alerts
- Switch between Celsius and Fahrenheit
- Enable Dark Mode override

### Sync Across Devices
- Sign in with your Google account
- Your preferences and saved cities will sync automatically
- Use the app offline in Guest mode (local storage only)

## API Keys 🔑

### OpenWeatherMap API
The app uses OpenWeatherMap's free tier API. The API key is configured in the server. For production use, get your own key at: https://openweathermap.org/api

## Project Structure 📂

```
Weather-Web/
├── src/
│   ├── components/          # React components
│   │   ├── AuthBar.tsx
│   │   ├── CitySearch.tsx
│   │   ├── DailyForecastList.tsx
│   │   ├── DashboardCustomizer.tsx
│   │   ├── DashboardGrid.tsx
│   │   ├── HistoricalCharts.tsx
│   │   └── HourlyForecastSlider.tsx
│   ├── api.ts              # API client
│   ├── App.tsx             # Main app component
│   ├── firebase.ts         # Firebase configuration
│   ├── types.ts            # TypeScript type definitions
│   └── useWeatherAlerts.ts # Weather alerts hook
├── server.ts               # Express server with API endpoints
├── firebase-applet-config.json
├── package.json
└── vite.config.ts
```

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons by [Lucide](https://lucide.dev/)
