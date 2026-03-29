import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherModel, LogEntry } from '../models/weather.model';
import { CitySearch } from './components/city-search/city-search';
import { SavedCities } from './components/saved-cities/saved-cities';
import { WeatherCard } from './components/weather-card/weather-card';
import { ActivityLog } from './components/activity-log/activity-log';
import { AccountService } from '../shared/services/account/account-service';
import { environment } from '../environment/environment';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CitySearch, SavedCities, WeatherCard, ActivityLog],
  templateUrl: './weather-dashboard.component.html',
  styleUrl: './weather-dashboard.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class WeatherDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  timeNow = '';
  maxCities = environment.MAX_CITIES;
  private clockTimer: any;
  hasApiKey = !!environment.API_KEY;
  isSearching = false;
  searchMsg: { text: string; type: string } | null = null;
  searchResult: WeatherModel | null = null;

  savedCities: WeatherModel[] = [];
  selectedCity: WeatherModel | null = null;

  showRemoveModal = false;
  pendingNewCity: WeatherModel | null = null;

  logs: LogEntry[] = [];

  compareCity1 = '';
  compareCity2 = '';
  comparisonResult: any = null;

  constructor(
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadFromStorage();
    this.loadLog();

    if (this.savedCities.length > 0) {
      this.selectedCity = this.savedCities[0];
    }
  }

  ngOnDestroy() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  updateClock() {
    this.timeNow = new Date().toLocaleTimeString();
    this.cdr.detectChanges();
  }

  showPage(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  

  loadFromStorage() {
    try {
      this.savedCities = JSON.parse(localStorage.getItem(environment.LS_CITIES) || '[]');
    } catch {
      this.savedCities = [];
    }
  }

  saveToStorage() {
    localStorage.setItem(environment.LS_CITIES, JSON.stringify(this.savedCities));
  }

  loadLog() {
    try {
      this.logs = JSON.parse(localStorage.getItem(environment.LS_LOG) || '[]');
    } catch {
      this.logs = [];
    }
  }

  saveLog() {
    localStorage.setItem(environment.LS_LOG, JSON.stringify(this.logs));
  }

  addLog(type: 'search' | 'save' | 'remove' | 'compare' | 'error' | 'refresh', message: string) {
    this.logs.unshift({ type, message, ts: new Date().toISOString() });
    if (this.logs.length > 200) this.logs.splice(200);
    this.saveLog();
  }

  clearLog() {
    if (!confirm('Clear all activity log entries?')) return;
    this.logs = [];
    this.saveLog();
    this.cdr.detectChanges();
  }



  onSearchCity(city: string) {
    if (this.isSearching) return;

    this.isSearching = true;
    this.searchMsg = null;
    this.searchResult = null;

    this.accountService.fetchWeather(city).subscribe({
      next: (model: any) => {
        this.searchResult = model;
        this.addLog('search', `Searched weather for "${model.cityName}, ${model.country}"`);
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err.message || 'Unknown error';

        this.searchMsg = {
          type: 'error',
          text:
            msg === 'City not found'
              ? '❌ City not found. Check spelling and try again.'
              : `❌ ${msg}`,
        };

        this.addLog('error', `Search failed for "${city}": ${msg}`);
        this.isSearching = false;
        this.cdr.detectChanges();
      },
    });
  }

  isCitySaved(cityName: string): boolean {
    return this.savedCities.some((c) => c.cityName.toLowerCase() === cityName.toLowerCase());
  }

  onSaveCity() {
    const model = this.searchResult;
    if (!model) return;

    if (this.isCitySaved(model.cityName)) {
      this.searchMsg = {
        type: 'info',
        text: `"${model.cityName}" is already in your saved cities.`,
      };
      this.cdr.detectChanges();
      return;
    }

    if (this.savedCities.length >= environment.MAX_CITIES) {
      this.pendingNewCity = model;
      this.showRemoveModal = true;
      this.cdr.detectChanges();
      return;
    }

    this.addCityToSaved(model);
  }

  addCityToSaved(model: WeatherModel) {
    this.savedCities.push(model);
    this.saveToStorage();

    this.addLog('save', `Saved city "${model.cityName}, ${model.country}"`);

    this.searchResult = null;
    this.searchMsg = {
      type: 'success',
      text: `✅ "${model.cityName}" saved successfully!`,
    };

    this.updateCompareSelects();

    setTimeout(() => {
      this.searchMsg = null;
      this.cdr.detectChanges();
    }, 2500);

    if (this.savedCities.length === 1) this.onCitySelected(model);

    this.cdr.detectChanges();
  }

  onCitySelected(model: WeatherModel) {
    this.selectedCity = model;
    this.cdr.detectChanges();
  }

  onCityRemoved(index: number) {
    const removed = this.savedCities[index];
    this.savedCities.splice(index, 1);
    this.saveToStorage();

    this.addLog('remove', `Removed city "${removed.cityName}"`);

    if (this.selectedCity?.cityName === removed.cityName) {
      this.selectedCity = null;
    }

    this.updateCompareSelects();
    this.cdr.detectChanges();
  }

  

  refreshCity(index: number) {
    const city = this.savedCities[index];
    if (!city || city.isLoading) return;

    this.savedCities[index] = {
      ...city,
      isLoading: true,
      hasError: false,
    };

    this.accountService.fetchWeather(city.cityName).subscribe({
      next: (model: any) => {
        model.isLoading = false;
        this.savedCities[index] = model;
        this.saveToStorage();

        this.addLog('refresh', `Refreshed weather for "${model.cityName}"`);

        if (this.selectedCity?.cityName === model.cityName) {
          this.selectedCity = model;
        }

        this.updateCompareSelects();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.savedCities[index] = {
          ...city,
          isLoading: false,
          hasError: true,
          errorMsg: err.message || 'Refresh failed',
        };

        this.addLog('error', `Refresh failed for "${city.cityName}": ${err.message}`);

        this.cdr.detectChanges();
      },
    });
  }

  

  closeModal() {
    this.showRemoveModal = false;
    this.pendingNewCity = null;
    this.cdr.detectChanges();
  }

  removeForNew(index: number) {
    this.onCityRemoved(index);
    this.closeModal();

    if (this.pendingNewCity) {
      this.addCityToSaved(this.pendingNewCity);
      this.pendingNewCity = null;
    }
  }

  

  updateCompareSelects() {
    if (this.compareCity1 && !this.savedCities.find((c) => c.cityName === this.compareCity1))
      this.compareCity1 = '';

    if (this.compareCity2 && !this.savedCities.find((c) => c.cityName === this.compareCity2))
      this.compareCity2 = '';

    this.onCompareCityChange();
  }

  onCompareCityChange() {
    if (this.canCompare && this.comparisonResult) {
      this.runComparison();
    } else {
      this.comparisonResult = null;
    }

    this.cdr.detectChanges();
  }

  get canCompare(): boolean {
    return !!(this.compareCity1 && this.compareCity2 && this.compareCity1 !== this.compareCity2);
  }

  runComparison() {
    const c1 = this.savedCities.find((c) => c.cityName === this.compareCity1);
    const c2 = this.savedCities.find((c) => c.cityName === this.compareCity2);

    if (!c1 || !c2) return;

    this.comparisonResult = {
      c1,
      c2,
      hotterCity: c1.temp >= c2.temp ? c1 : c2,
      colderCity: c1.temp < c2.temp ? c1 : c2,
      moreHumid: c1.humidity >= c2.humidity ? c1 : c2,
      windier: c1.windSpeed >= c2.windSpeed ? c1 : c2,
    };
  }

  triggerComparisonLog() {
    this.runComparison();

    if (this.comparisonResult) {
      this.addLog(
        'compare',
        `Compared "${this.comparisonResult.c1.cityName}" vs "${this.comparisonResult.c2.cityName}"`,
      );
      this.cdr.detectChanges();
    }
  }
}
