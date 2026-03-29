<!-- # WeatherApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page. -->


# WeatherScope — Angular Weather Dashboard

A fully-featured weather dashboard assignment demonstrating Angular component architecture, parent-child communication, and clean state management.

---

## 🚀 Setup Steps

### Prerequisites
- Node.js 18+
- Angular CLI: `npm install -g @angular/cli`
- OpenWeatherMap API key (free at https://openweathermap.org/api)

### Installation
```bash
git clone <repo-url>
cd weather-dashboard
npm install
```

### API Key Configuration
Open `src/environments/environment.ts` and set:
```ts
export const environment = {
  production: false,
  openWeatherApiKey: 'YOUR_API_KEY_HERE',
  apiBaseUrl: 'https://api.openweathermap.org/data/2.5'
};
```

### Run Development Server
```bash
ng serve
# Navigate to http://localhost:4200
```

### Build for Production
```bash
ng build --configuration production
```

---

## 🏗 Component Structure

```
AppComponent
└── WeatherDashboardComponent (page router + global state holder)
    ├── CitySearchComponent          [@Output: citySearched, @Output: citySearchFailed]
    │   └── WeatherCardComponent     [@Input: weather, @Output: saveRequested]
    ├── SavedCitiesComponent         [@Input: cities, @Output: citySelected, @Output: cityRemoved, @Output: cityRefreshed]
    ├── WeatherDetailComponent       [@Input: selectedCity]
    ├── WeatherComparisonComponent   [@Input: savedCities]
    └── ActivityLogComponent         [@Input: logEntries] (reads/writes localStorage)
```

---

## 📡 How Parent-Child Communication Works

### 1. `@Input()` — Data flows DOWN (parent → child)

```ts
// SavedCitiesComponent
@Input() cities: WeatherModel[] = [];
@Input() selectedCity: WeatherModel | null = null;

// WeatherDetailComponent
@Input() city: WeatherModel | null = null;

// WeatherComparisonComponent
@Input() savedCities: WeatherModel[] = [];
```

### 2. `@Output()` + `EventEmitter` — Events flow UP (child → parent)

```ts
// CitySearchComponent
@Output() citySearched = new EventEmitter<WeatherModel>();
@Output() searchFailed = new EventEmitter<string>();

// SavedCitiesComponent
@Output() citySelected  = new EventEmitter<WeatherModel>();
@Output() cityRemoved   = new EventEmitter<number>();   // emits index
@Output() cityRefreshed = new EventEmitter<number>();   // emits index
```

### 3. Parent wires everything together

```html
<!-- WeatherDashboardComponent template -->
<app-city-search
  (citySearched)="onCitySearched($event)"
  (searchFailed)="onSearchFailed($event)">
</app-city-search>

<app-saved-cities
  [cities]="savedCities"
  [selectedCity]="selectedCity"
  (citySelected)="onCitySelected($event)"
  (cityRemoved)="onCityRemoved($event)"
  (cityRefreshed)="onCityRefreshed($event)">
</app-saved-cities>

<app-weather-detail [city]="selectedCity"></app-weather-detail>

<app-weather-comparison [savedCities]="savedCities"></app-weather-comparison>
```

### 4. Parent handles cross-component logic

```ts
// WeatherDashboardComponent
onCitySearched(model: WeatherModel) {
  this.searchResult = model;
  this.logService.add('search', `Searched "${model.cityName}"`);
}

onCitySelected(model: WeatherModel) {
  this.selectedCity = model;           // → flows down to WeatherDetailComponent
}

onCityRemoved(index: number) {
  const removed = this.savedCities[index];
  this.savedCities.splice(index, 1);   // mutates only in parent
  this.persistService.save(this.savedCities);
  if (this.selectedCity?.cityName === removed.cityName) {
    this.selectedCity = null;
  }
  this.logService.add('remove', `Removed "${removed.cityName}"`);
}
```

**Key rule**: `SavedCitiesComponent` never directly mutates the cities array — it only emits events. The parent (WeatherDashboardComponent) owns and mutates the data.

---

## 🔄 Data Flow Diagram

```
User types city → CitySearchComponent
  → calls WeatherApiService.fetch(city)
  → emits citySearched(WeatherModel) ↑ to WeatherDashboardComponent
  → parent stores searchResult, passes to WeatherCardComponent via @Input
  → user clicks Save → WeatherCardComponent emits saveRequested ↑
  → parent validates (no dups, < 5 limit) → pushes to savedCities[]
  → savedCities[] passed down to SavedCitiesComponent via @Input
  → user clicks a city → SavedCitiesComponent emits citySelected ↑
  → parent sets selectedCity → flows down to WeatherDetailComponent via @Input
```

---

## 🌦 WeatherModel Interface

```ts
export interface WeatherModel {
  id: number;
  cityName: string;
  country: string;
  temp: number;           // °C
  feelsLike: number;      // °C
  humidity: number;       // %
  windSpeed: number;      // km/h (converted from m/s)
  description: string;
  icon: string;           // emoji mapped from OWM icon code
  visibility: number;     // km
  fetchedAt: string;      // ISO timestamp
  hasError: boolean;
  errorMsg: string;
  isLoading: boolean;
}
```

Raw API response is **never** used directly in templates — always mapped through `WeatherMapperService.map(raw)` first.

---

## ⚖ Comparison Feature

- Only available when `savedCities.length >= 2`
- Comparison result is **derived** (computed on-demand), never stored as permanent state
- Summary sentences are **dynamically generated** from actual data:
  ```ts
  const summary = `${hotterCity.cityName} is hotter than ${colderCity.cityName} by ${tempDiff}°C`;
  ```

---

## 🧪 Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| Empty input | Input validation before API call |
| Invalid city | API 404 → user-friendly message |
| Duplicate city | Checked before save; shows info message |
| City limit (5) | Modal prompts user to remove one first |
| API failure on search | Error message shown; logged to activity |
| API failure on refresh | Old data retained; error shown on card |
| Refresh while comparing | Comparison re-runs with old data; card refreshes independently |
| City removed while selected | Detail panel clears gracefully |
| City removed while in comparison | Comparison dropdowns updated; result cleared |
| Fast repeated search clicks | Button disabled during in-flight request |
| localStorage parse error | Falls back to empty array gracefully |

---

## 📋 Activity Log

Stored in `localStorage` under key `ws_activity_log`. Each entry:
```ts
interface LogEntry {
  type: 'search' | 'save' | 'remove' | 'compare' | 'error' | 'refresh';
  message: string;
  ts: string; // ISO timestamp
}
```
Latest entries appear on top. Max 200 entries retained. Filterable by type.

---

## 💡 Assumptions Made

1. **Units**: Temperature in °C, wind speed converted from m/s to km/h for readability
2. **City identity**: Cities matched by name (case-insensitive) — not by OWM city ID, since user-typed names may vary
3. **Refresh**: Individual card refresh re-fetches from API and updates only that city; comparison is not auto-updated
4. **Persistence**: Saved cities persist across sessions via localStorage; log also persists
5. **State management**: No NgRx — clean service-based state with BehaviorSubjects where needed
6. **Comparison**: Comparison result is computed each time "Compare Now" is clicked, not stored
7. **Demo mode**: When no API key is configured, mock data is returned for 8 preset cities

---

## 📦 Services

```
WeatherApiService      — HTTP calls, response mapping
ActivityLogService     — localStorage read/write for log
CityPersistService     — localStorage read/write for cities
WeatherMapperService   — maps raw API → WeatherModel
```

---

*Built by Akansha Kaushik · WeatherScope Assignment*

