import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherModel } from '../../../models/weather.model';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-card.html',
  styleUrl: './weather-card.css',
})
export class WeatherCard {
  @Input() weather: WeatherModel | null = null;
  @Input() mode: 'preview' | 'detail' = 'preview';
  @Input() isSaved: boolean = false;
  @Input() showActions: boolean = true;

  @Output() save = new EventEmitter<void>();
}
