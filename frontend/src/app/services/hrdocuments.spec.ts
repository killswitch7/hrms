import { TestBed } from '@angular/core/testing';

import { Hrdocuments } from './hrdocuments';

describe('Hrdocuments', () => {
  let service: Hrdocuments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Hrdocuments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
