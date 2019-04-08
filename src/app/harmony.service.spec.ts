import { TestBed } from '@angular/core/testing';

import { HarmonyService } from './harmony.service';

describe('HarmonyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HarmonyService = TestBed.get(HarmonyService);
    expect(service).toBeTruthy();
  });
});
