import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedCities } from './saved-cities';

describe('SavedCities', () => {
  let component: SavedCities;
  let fixture: ComponentFixture<SavedCities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedCities],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedCities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
