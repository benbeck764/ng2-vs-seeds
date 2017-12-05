import { Component, OnInit, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import { SvgDimension } from "../heartrate/heartrate.component";
import { DateTimeFrame } from "../parent/parent.component";

@Component({
  selector: 'pg-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimesliderComponent implements OnInit {

  private currentN: number = 15;
  private currentHours: number = 4;
  private btnValue: string = "30 Minute View";

  private defaultDataValue: number = -1;
  private margin: any = { top: 5, right: 20, bottom: 30, left: 30 };
  private pixelsPerMinute: number = 15;

  private dateTimeNow: moment.Moment = moment().startOf('minute').subtract(this.currentHours, 'hours');
  private dateTimeNHours: moment.Moment = this.dateTimeNow.clone().add(this.currentHours, 'hours');

  private sliderDateTimeEnd: moment.Moment = this.dateTimeNHours.clone();
  private sliderDateTimeStart: moment.Moment = this.dateTimeNHours.clone().subtract(this.currentN, 'minutes');
  private sliderOffset: moment.Duration = moment.duration(this.dateTimeNow.clone().diff(this.sliderDateTimeStart.clone()));

  private yMinHb: number = 30;
  private yMaxHb: number = 240;

  private tsSvg;
  private tsSvgWidth = 1650;
  private tsSvgHeight = 100;
  private g;
  private navG;
  private xAxisNavG;
  private sliderTimeTicksG;
  private viewPortG;
  private brush;

  private x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNHours.toDate()]).range([0, this.tsSvgWidth]);
  private yHb = d3.scaleLinear().domain([this.yMinHb, this.yMaxHb]).range([this.tsSvgHeight, 0]);

  @Output() nChanged = new EventEmitter<number>();
  @Output() timeChanged = new EventEmitter<DateTimeFrame>();

  constructor() { }

  findClosestSnapWindow(newTimeFrame: DateTimeFrame): DateTimeFrame {

    // Get the difference between the end of the slider axis and end of slider time frame
    var duration = moment.duration(this.dateTimeNHours.clone().diff(newTimeFrame.endDateTime));
    // Round this get the nearest window of time
    var roundedDurationMins = Math.round(duration.asMinutes() / this.currentN) * this.currentN;

    // Set the new slider window range
    var newEndTime = this.dateTimeNHours.clone().subtract(roundedDurationMins, 'minutes');
    var newStartTime = newEndTime.clone().subtract(this.currentN, 'minutes');
    return new DateTimeFrame(newStartTime, newEndTime);
  }

  onBrushStart(d3Element) {
    // Only transition after input and valid selection
    if (!d3.event.sourceEvent || !d3.event.selection) return;

    // Remove old ticks
    this.g.selectAll(".slider-ticks").remove();
  }

  onBrushEnd(d3Element) {
    // Only transition after input and valid selection
    if (!d3.event.sourceEvent || !d3.event.selection) return; 

    // Get the current time extent of viewport
    var viewportExtent = d3.event.selection;
    var newStart = moment(this.x.invert(viewportExtent[0]));
    var newEnd = moment(this.x.invert(viewportExtent[1]));

    // Find closest currentN minute window to "snap" to
    var closestDateTimeWindow = this.findClosestSnapWindow(new DateTimeFrame(newStart, newEnd));
    var newXStart : number = this.x(closestDateTimeWindow.startDateTime.toDate());
    var newXEnd : number = this.x(closestDateTimeWindow.endDateTime.toDate());

    // "Snap" the slider to the new location
    d3.select(d3Element).transition().call(this.brush.move, [newXStart, newXEnd]);

    // Set the slider start/end variables to the new position
    this.sliderDateTimeStart = moment(this.x.invert(newXStart));
    this.sliderDateTimeEnd = moment(this.x.invert(newXEnd));

    // Redraw slider ticks to new location
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);

    // Emit New DateTimeFrame up to Parent Component and then back down to HeartRate Component
    this.timeChanged.emit(new DateTimeFrame(this.sliderDateTimeStart, this.sliderDateTimeEnd));
  }

  initTimeSliderGraph() {

    // Create SVG
    d3.selectAll("#timeslider-chart > svg").data([]).exit().remove();

    this.tsSvg = d3.select("#timeslider-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.tsSvgHeight);

    // Setup Initial ViewBox and add Responsive Container to SVG
    this.tsSvg
      .attr('viewBox', '0 0 ' + this.getSvgDimensions().width + ' ' + (this.getSvgDimensions().height + (this.margin.bottom / 3)))
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    // Add Navigation Chart
    this.g = this.tsSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate (" + this.margin.left + "," + this.margin.top + ")");

    // Add Navigation Background
    this.g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.getSvgDimensions().width)
      .attr("height", this.getSvgDimensions().height)
      .style("fill", "#F5F5F5")
      .style("shape-rendering", "crispEdges")
      .attr("transform", "translate(0, 0)");

    // Add Group to Hold Data
    this.navG = this.g.append("g")
      .attr("class", "nav");

    // Define Nav Chart Scales
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNHours.toDate()]).range([0, this.getSvgDimensions().width]);
    this.yHb = d3.scaleLinear().domain([this.yMinHb, this.yMaxHb]).range([this.getSvgDimensions().height, 0]);

    // Add Group for X-Axis & Draw Time Ticks
    this.drawXAxis();

    // Create Brush (Slider Time Domain)
    this.brush = d3.brushX()
      .extent([[0, 0], [this.getSvgDimensions().width, this.getSvgDimensions().height]])
      .on("end", (data, index, d3Element) => {
        this.onBrushEnd(d3Element[0]);
      })
      .on("start", (date, index, d3Element) => {
        this.onBrushStart(d3Element[0]);
      });

    // Create Group & Assign to Brush
    this.viewPortG = this.g.append("g")
      .attr("class", "viewport")
      .call(this.brush)
      .call(this.brush.move, [this.x(this.sliderDateTimeStart.toDate()), this.x(this.sliderDateTimeEnd.toDate())]) // Setup initial slider location
        .selectAll("rect")
        .attr("height", this.getSvgDimensions().height);

    // Add Initial Slider Ticks
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);
  }

  drawXAxis() {
    // Add X-Axis (Interval Ticks)
    this.xAxisNavG = this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (this.yHb(this.yMinHb)) + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeHour.every(1))
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(-(this.tsSvgHeight), 1, 0)
    );

    // Add dashed lines and move the time tick text up
    this.xAxisNavG.selectAll("line").attr("stroke-dasharray", 2);
    this.xAxisNavG .selectAll("text").attr("y", -75);
  }

  drawTimeSliderTicks(newStart: moment.Moment, newEnd: moment.Moment) {

    // Remove old ticks
    this.g.selectAll(".slider-ticks").remove();

    // Append new ticks
    this.sliderTimeTicksG = this.g.append("g")
      .attr("class", "slider-ticks")
      .attr("transform", "translate(0," + (this.yHb(this.yMinHb)) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([newStart.toDate(), newEnd.toDate()])
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(-(this.tsSvgHeight), 1, 0)
      );

    // Remove tick lines and move text
    this.sliderTimeTicksG.selectAll("line").remove();
    this.sliderTimeTicksG.selectAll("text").attr("y", -75);
  }

  ngOnInit() {
    console.log('Timeslider Component');
    //this.emitUpdate();

    this.initTimeSliderGraph();
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
    this.updateSliderStartEnd();
  }

  emitUpdate() {
    this.nChanged.emit(this.currentN);
  }

  updateSliderStartEnd() {
    if (this.currentN === 15) {
      this.sliderDateTimeStart = this.sliderDateTimeStart.clone().add(15, 'minutes');
    } else if (this.currentN === 30) {
      var tempTimeStart = this.sliderDateTimeStart.clone().subtract(15, 'minutes');

      // We're as far left as we can go, move it back
      if (tempTimeStart.toDate() < moment(this.x.invert(0)).toDate()) {
        this.sliderDateTimeStart = moment(this.x.invert(0));
        this.sliderDateTimeEnd = this.sliderDateTimeStart.clone().add(30, 'minutes');
      } else {
        this.sliderDateTimeStart = this.sliderDateTimeStart.clone().subtract(15, 'minutes');
      }
    }

    // Move the slider start (or end?) to the new location
    d3.select(".viewport").transition().call(this.brush.move, [this.x(this.sliderDateTimeStart.toDate()), this.x(this.sliderDateTimeEnd.toDate())]);
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);
  }

  private getSvgDimensions(): SvgDimension {
    var myWidth = this.tsSvg.style("width").replace("px", "");
    var myHeight = this.tsSvg.style("height").replace("px", "");
    return new SvgDimension(+myWidth, +myHeight);
  }
}
