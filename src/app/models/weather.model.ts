export interface WeatherModel {
  id: number;
  cityName: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  visibility: string;
  fetchedAt: string;
  hasError: boolean;
  errorMsg: string;
  isLoading: boolean;
}

export interface LogEntry {
  type: 'search' | 'save' | 'remove' | 'compare' | 'error' | 'refresh';
  message: string;
  ts: string;
}
