import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherModel } from '../../../models/weather.model';

@Component({
  selector: 'app-saved-cities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-cities.html',
  styleUrl: './saved-cities.css',
})
export class SavedCities {
  @Input() savedCities: WeatherModel[] = [];
  @Input() selectedCity: WeatherModel | null = null;
  @Input() maxCities: number = 5;

  @Output() selectCity = new EventEmitter<WeatherModel>();
  @Output() removeCity = new EventEmitter<number>();
  @Output() refreshCity = new EventEmitter<number>();

  onSelect(city: WeatherModel) {
    this.selectCity.emit(city);
  }

  onRemove(index: number, event: Event) {
    event.stopPropagation();
    this.removeCity.emit(index);
  }

  onRefresh(index: number, event: Event) {
    event.stopPropagation();
    this.refreshCity.emit(index);
  }
}
