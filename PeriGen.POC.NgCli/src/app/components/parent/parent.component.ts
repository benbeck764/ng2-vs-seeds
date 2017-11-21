import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'pg-parent',
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.scss']
})
export class ParentComponent implements OnInit {

  private currentInterval: number;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() { }

  intervalChanged(interval: number): void {
    this.currentInterval = interval;
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
