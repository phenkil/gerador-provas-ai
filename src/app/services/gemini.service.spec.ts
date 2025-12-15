import { TestBed } from '@angular/core/testing';

import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeminiService = TestBed.get(GeminiService);
    expect(service).toBeTruthy();
  });
});
