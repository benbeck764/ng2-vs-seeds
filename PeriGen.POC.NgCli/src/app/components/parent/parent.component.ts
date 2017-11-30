import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Moment } from "moment/moment";

export class DateTimeFrame {
  public startDateTime: Moment;
  public endDateTime: Moment;
  constructor(start: Moment, end: Moment) {
    this.startDateTime = start;
    this.endDateTime = end;
  }
}

@Component({
  selector: 'pg-parent',
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.scss']
})
export class ParentComponent implements OnInit {

  private currentInterval: number;
  private currentDateTimeFrame: DateTimeFrame;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() { }

  intervalChanged(interval: number): void {
    this.currentInterval = interval;
  }

  timeChanged(dateTimeFrame: DateTimeFrame): void {
    this.currentDateTimeFrame = dateTimeFrame;
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
