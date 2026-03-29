import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-city-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './city-search.html',
  styleUrl: './city-search.css',
})
export class CitySearch {
  @Input() isSearching: boolean = false;
  @Input() searchMsg: { text: string; type: string } | null = null;
  @Output() search = new EventEmitter<string>();

  cityName: string = '';

  onSearch() {
    if (this.cityName.trim() && !this.isSearching) {
      this.search.emit(this.cityName.trim());
      // Input will be cleared or kept based on what parent wants.
      // Easiest is to keep it, but parent clears search state on success.
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}
