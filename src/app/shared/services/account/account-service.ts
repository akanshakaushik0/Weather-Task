import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { ApiService } from '../api/api-service';
import { WeatherModel } from '../../../models/weather.model';

const API_KEY = '0b4ae15b6e44d28fd75aa378da3ef714';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private api: ApiService) {}

  fetchWeather(city: string): Observable<WeatherModel> {
    return this.api
      .get<any>(`weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
      .pipe(
        map((res) => this.mapApiToModel(res)),
        catchError((err) => {
          if (err.status === 404) {
            return throwError(() => new Error('City not found'));
          }

          console.warn('API failed, using mock data');

          try {
            return of(this.mockWeather(city));
          } catch {
            return throwError(() => new Error('Failed to fetch weather'));
          }
        }),
      );
  }

  private mapApiToModel(raw: any): WeatherModel {
    return {
      id: raw.id,
      cityName: raw.name,
      country: raw.sys?.country || '',
      temp: Math.round(raw.main.temp),
      feelsLike: Math.round(raw.main.feels_like),
      humidity: raw.main.humidity,
      windSpeed: Math.round(raw.wind?.speed * 3.6),
      description: raw.weather?.[0]?.description || '',
      icon: this.weatherIcon(raw.weather?.[0]?.icon || ''),
      visibility: raw.visibility ? (raw.visibility / 1000).toFixed(1) : 'N/A',
      fetchedAt: new Date().toISOString(),
      hasError: false,
      errorMsg: '',
      isLoading: false,
    };
  }

  private weatherIcon(code: string): string {
    const map: Record<string, string> = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '🌥',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧',
      '09n': '🌧',
      '10d': '🌦',
      '10n': '🌧',
      '11d': '⛈',
      '11n': '⛈',
      '13d': '❄️',
      '13n': '❄️',
      '50d': '🌫',
      '50n': '🌫',
    };
    return map[code] || '🌡';
  }

  private mockWeather(city: string): WeatherModel {
    const cities: Record<string, any> = {
      delhi: {
        name: 'Delhi',
        temp: 38,
        feelsLike: 42,
        hum: 55,
        wind: 5.2,
        desc: 'haze',
        icon: '50d',
        vis: 2.5,
        country: 'IN',
      },
    };

    const key = city.toLowerCase().replace(/\s+/g, '');
    const d = cities[key];

    if (!d) throw new Error('City not found');

    return {
      id: Math.random(),
      cityName: d.name,
      country: d.country,
      temp: d.temp,
      feelsLike: d.feelsLike,
      humidity: d.hum,
      windSpeed: Math.round(d.wind * 3.6),
      description: d.desc,
      icon: this.weatherIcon(d.icon),
      visibility: d.vis,
      fetchedAt: new Date().toISOString(),
      hasError: false,
      errorMsg: '',
      isLoading: false,
    };
  }
}
