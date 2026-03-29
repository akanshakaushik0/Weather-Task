import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogEntry } from '../../../models/weather.model';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-log.html',
  styleUrl: './activity-log.css',
})
export class ActivityLog {
  @Input() logs: LogEntry[] = [];
  @Output() clearLogs = new EventEmitter<void>();

  filter: string = 'all';

  get filteredLogs(): LogEntry[] {
    if (this.filter === 'all') return this.logs;
    return this.logs.filter(log => log.type === this.filter);
  }

  setFilter(type: string) {
    this.filter = type;
  }

  getEmoji(type: string): string {
    const map: Record<string, string> = {
      search: '🔍', save: '💾', remove: '🗑',
      compare: '⚖', error: '⚠', refresh: '🔄'
    };
    return map[type] || '🔍';
  }
}
