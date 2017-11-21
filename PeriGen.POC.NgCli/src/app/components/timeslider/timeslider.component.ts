import { Component, OnInit, Output, EventEmitter  } from '@angular/core';

@Component({
  selector: 'pg-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.scss']
})
export class TimesliderComponent implements OnInit {

  private currentN: number = 15;
  private btnValue: string = "30 Minute View";

  @Output() nChanged = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
    console.log('Timeslider Component');
    this.emitUpdate();
  }

  toggleTime() {

    if (this.currentN === 15) {
      this.currentN = 30;
      this.btnValue = "15 Minute View";
    }
    else if (this.currentN === 30) {
      this.currentN = 15;
      this.btnValue = "30 Minute View";
    }

    this.emitUpdate();
  }

  emitUpdate() {
    this.nChanged.emit(this.currentN);
  }
}
