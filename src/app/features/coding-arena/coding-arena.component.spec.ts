import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingArenaComponent } from './coding-arena.component';

describe('CodingArenaComponent', () => {
  let component: CodingArenaComponent;
  let fixture: ComponentFixture<CodingArenaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CodingArenaComponent]
    });
    fixture = TestBed.createComponent(CodingArenaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
