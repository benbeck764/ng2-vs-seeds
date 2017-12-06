import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';

export class DateTimeFrame {
  public startDateTime: moment.Moment;
  public endDateTime: moment.Moment;
  public isRealTime: boolean;
  constructor(start: moment.Moment, end: moment.Moment, isRealTime: boolean) {
    this.startDateTime = start;
    this.endDateTime = end;
    this.isRealTime = isRealTime;
  }
}

export class IntervalChanged {
   public startDateTime: moment.Moment;
   public endDateTime: moment.Moment;
   public newN: number;
   constructor(start: moment.Moment, end: moment.Moment, newN: number) {
     this.startDateTime = start;
     this.endDateTime = end;
     this.newN = newN;
   }
}

@Component({
  selector: 'pg-parent',
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.scss']
})
export class ParentComponent implements OnInit {

  private currentInterval: IntervalChanged;
  private newTime: moment.Moment;
  private currentDateTimeFrame: DateTimeFrame;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() { }

  timeIncremented(newTime: moment.Moment): void {
    this.newTime = newTime;
  }

  intervalChanged(interval: IntervalChanged): void {
    this.currentInterval = interval;
  }

  timeChanged(dateTimeFrame: DateTimeFrame): void {
    this.currentDateTimeFrame = dateTimeFrame;
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
