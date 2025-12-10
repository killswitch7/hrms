import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hrdocuments } from './hrdocuments';

describe('Hrdocuments', () => {
  let component: Hrdocuments;
  let fixture: ComponentFixture<Hrdocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hrdocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hrdocuments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
