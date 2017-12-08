import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ViewEncapsulation, SimpleChange } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import { SvgDimension, SvgPosition, HbDataPoint } from "../heartrate/heartrate.component";
import { DateTimeFrame, IntervalChanged } from "../parent/parent.component";

@Component({
  selector: 'pg-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimesliderComponent implements OnInit, OnChanges {

  // Global TimeFrames
  private currentN: number = 15;
  private currentHours: number = 4;

  // Slider Text
  private toggleText;
  private textValue: string = "to 30 min";

  // Data-Related
  private defaultDataValue: number = null;

  // TODO -- LineCount should come from HB component? OR a global parent component...
  private lineCount = 4;
  private colors = ["purple", "blue", "green", "red"];
  private dataHb;
  private dataUa;
  private compressionSecondsHb: number = 16;
  
  // Component Global Time
  private dateTimeNow: moment.Moment = moment().subtract(this.currentHours, 'hours');
  private dateTimeNHours: moment.Moment = this.dateTimeNow.clone().add(this.currentHours, 'hours');

  // Slider-Related
  private isRealTime: boolean;
  private sliderDateTimeEnd: moment.Moment = this.dateTimeNHours.clone();
  private sliderDateTimeStart: moment.Moment = this.dateTimeNHours.clone().subtract(this.currentN, 'minutes');
  private sliderOffset: moment.Duration = moment.duration(this.dateTimeNow.clone().diff(this.sliderDateTimeStart.clone()));

  // Time-Slider SVG-Related
  private tsSvg;
  private tsSvgWidth = 1650;
  private tsSvgHeight = 125;
  private margin: any = { top: 5, right: 20, bottom: 30, left: 30 };
  private padding: any = { bottom: 20 };
  private g;
  private navG;
  private xAxisNavG;
  private sliderTimeTicksG;
  private viewPortG;
  private viewPortSelection;
  private brush;

  // Compressed View SVG-Related
  private compressedHbHeight = 45;
  private lineHb;
  private pathsGHb;

  // Time Scale Constants
  private yMinHb: number = 30;
  private yMaxHb: number = 240;
  private yMinUa: number = 0;
  private yMaxUa: number = 100;

  // Time Scales
  private x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNHours.toDate()]).range([0, this.tsSvgWidth]);
  private yHb = d3.scaleLinear().domain([this.yMinHb, this.yMaxHb]).range([this.tsSvgHeight, this.tsSvgHeight - this.compressedHbHeight]);
  private yUa = d3.scaleLinear().domain([this.yMinUa, this.yMaxUa]).range([this.tsSvgHeight, 0]);

  // Components @Input & @Outputs
  @Input() newTime: moment.Moment;
  @Input() newHbData: HbDataPoint[];
  @Output() nChanged = new EventEmitter<IntervalChanged>();
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
    return new DateTimeFrame(newStartTime, newEndTime, null);
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
    var closestDateTimeWindow = this.findClosestSnapWindow(new DateTimeFrame(newStart, newEnd, null));
    var newXStart : number = this.x(closestDateTimeWindow.startDateTime.toDate());
    var newXEnd: number = this.x(closestDateTimeWindow.endDateTime.toDate());

    // "Snap" the slider to the new location
    d3.select(d3Element).transition().call(this.brush.move, [newXStart, newXEnd]);

    // Set the slider start/end variables to the new position
    this.sliderDateTimeStart = moment(this.x.invert(newXStart));
    this.sliderDateTimeEnd = moment(this.x.invert(newXEnd));

    // Redraw slider ticks to new location
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);

    // Move the slider to text to new location
    this.moveToggleText(false);

    // Emit New DateTimeFrame up to Parent Component and then back down to HeartRate Component
    var xMax: number = this.x(this.x.domain()[1]);
    this.isRealTime = newXEnd >= xMax; // (Slider is moved all the way to the right)
    this.timeChanged.emit(new DateTimeFrame(this.sliderDateTimeStart, this.sliderDateTimeEnd, this.isRealTime));
  }

  initTimeSliderGraph() {

    // Initialize Data Array w/ Default Values (null)
    this.dataHb = new Array(this.lineCount);
    for (var i = 0; i < this.lineCount; i++) {
      this.dataHb[i] = d3.range((this.currentHours * 3600) / this.compressionSecondsHb).map(d => {
        var dataPoint = new HbDataPoint(-1);
        dataPoint.timestamp = moment();
        dataPoint.value = null;
        return dataPoint;
      });
    }

    // Create SVG
    d3.selectAll("#timeslider-chart > svg").data([]).exit().remove();

    this.tsSvg = d3.select("#timeslider-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .style("height", this.tsSvgHeight + "px")
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.tsSvgHeight);

    // Setup Initial ViewBox and add Responsive Container to SVG
    this.tsSvg
      .attr('viewBox', '0 0 ' +
          this.getSvgDimensions().width + ' ' + (this.getSvgDimensions().height + (this.margin.bottom / 3) + 2.5)) // TODO - Magic 2.5
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
      .attr("height", this.getSvgDimensions().height - this.padding.bottom)
      .style("fill", "#F5F5F5")
      .style("shape-rendering", "crispEdges")
      .attr("transform", "translate(0, 0)");

    // Add Group to Hold Data
    this.navG = this.g.append("g")
      .attr("class", "nav");

    // Define Nav Chart Scales
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNHours.toDate()]).range([0, this.getSvgDimensions().width]);
    this.yHb = d3.scaleLinear().domain([this.yMinHb, this.yMaxHb]).range([this.getSvgDimensions().height - this.padding.bottom, 0]);

    // Create Brush (Slider Time Domain)
    this.brush = d3.brushX()
      .extent([[0, 0], [this.getSvgDimensions().width, this.getSvgDimensions().height - this.padding.bottom]])
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
      .call(this.brush.move, [this.x(this.sliderDateTimeStart.toDate()), this.x(this.sliderDateTimeEnd.toDate())]); // Setup initial slider location

    // Give a height to all the rectangle components of the viewport
    this.viewPortG.selectAll("rect")
      .attr("height", this.getSvgDimensions().height - this.padding.bottom);

    // Add Group for X-Axis & Draw Time Ticks
    this.drawXAxis();

    // Add Initial Slider Ticks
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);

    // Add Toggle Time Text below Slider Window
    this.viewPortSelection = d3.select(".viewport > .selection");
    var selectionPosition = this.getSelectionPosition();
    var selectionDimensions = this.getSelectionDimensions();
    this.toggleText = this.g
      .append("text")
      .attr("x", (d) => {
        return selectionPosition.x + (selectionDimensions.width / 2);
      })
      .attr("y", (d) => {
        return selectionPosition.y + selectionDimensions.height + 10;
      })
      .attr("class", "toggle-text d-none")
      .attr("text-anchor", "middle")
      .attr("font-size", "0.75em")
      .attr("text-decoration", "underline")
      .style("stroke", "blue")
      .text(this.textValue)
      .on("click", (d) => {
        this.toggleTime();
      });

    // Hide/Display for the Toggle Time Text when leaving/entering slider
    this.viewPortSelection
      .on("mouseenter", (d) => {
        this.displayToggleText(true);
      });
    this.viewPortSelection
      .on("mouseleave", (d) => {
        this.displayToggleText(false);
      });

    // Initialzie Compressed HB/UA Views
    this.initCompressedHbView();
  }

  initCompressedHbView() {
     // Setup HeartBeat Line
    this.lineHb = d3.line()
      .defined((d: HbDataPoint) => d.value !== null)
      .curve(d3.curveBasis)
      .x((d: HbDataPoint, i) => {
        return this.x(d.timestamp.toDate());
      })
      .y((d: HbDataPoint, i) => {
        return this.yHb(d.value);
      });

    // Setup SVG Group that will contain HB line(s)
    this.pathsGHb = this.g.append("g")
      .attr("class", "hb-paths-g");

    // Initialize the Paths
    for (var i = 0; i < this.lineCount; i++) {
      var myData = this.dataHb[i];
      var it = this.pathsGHb.append("g")
        .attr("clip-path", "url(#clip)")
        .append("path")
        .data([myData])
        .attr("class", "line " + this.colors[i] + "-line")
        .attr("data-color-idx", i);
    }
  }

  drawXAxis() {
    // Remove old axis
    this.g.selectAll(".axis--x").remove();

    // Add X-Axis (Interval Ticks)
    this.xAxisNavG = this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (this.yHb(this.yMinHb)) + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeHour.every(1))
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(-(this.tsSvgHeight - this.padding.bottom), 1, 0)
    );

    // Add dashed lines and move the time tick text up
    this.xAxisNavG.selectAll("line").attr("stroke-dasharray", 2);
    this.xAxisNavG.selectAll("text").attr("y", -75);
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
    this.sliderTimeTicksG.selectAll("path").remove();
    this.sliderTimeTicksG.selectAll("line").remove();
    this.sliderTimeTicksG.selectAll("text").attr("y", -75);

    var ticksText = this.sliderTimeTicksG.selectAll("text");
    ticksText.each((d, i, d3Element) => {
      if (i === 0) {
        d3.select(d3Element[0]).attr("x", 12.5);
      }
      if (i === 1) {
        d3.select(d3Element[1]).attr("x", -12.5);
      }
    });
  }

  ngOnInit() {
    console.log('Timeslider Component');
    this.initTimeSliderGraph();
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }): void {
    var newTime = changes['newTime'];
    if (typeof (newTime) !== "undefined" && typeof (newTime.currentValue) !== "undefined") {
      //if (!newTime.firstChange) { this.updateTime(newTime.currentValue.toDate()); }
      this.updateTime(newTime.currentValue.toDate());
    }

    var newHbData = changes['newHbData'];
    if (typeof (newHbData) !== "undefined" && typeof (newHbData.currentValue) !== "undefined") {
      this.updateHbData(newHbData.currentValue);
    }
  }

  updateHbData(newHbData: HbDataPoint[]) {
    // TODO -- Implement after setting up SVG to draw HB Lines
    for (var i = 0; i < this.lineCount; i++) {
      // Add data to TimeSlider HB Data Array
      var dpByColorIdx = newHbData.find(dp => dp.colorIndex === i);
      this.dataHb[i].push(dpByColorIdx);

      // Update line
      var selectedPath = this.pathsGHb.select("path[data-color-idx='" + i + "']");
      selectedPath.attr("d", this.lineHb);
      this.dataHb[i].shift(); // TODO -- Do we want to shift or hold onto all?
    }
  }

  updateTime(newTime: moment.Moment) {

    // Update Entire Slider Range
    this.dateTimeNHours = moment(newTime);
    this.dateTimeNow = this.dateTimeNHours.clone().subtract(this.currentHours, 'hours');

    // Update Slider Viewport Range
    this.sliderDateTimeEnd = this.dateTimeNHours;
    this.sliderDateTimeStart = this.dateTimeNHours.clone().subtract(this.currentN, 'minutes');

    // Update X-Axis Scale & Re-Draw Slider Ticks & X-Axis Ticks
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNHours.toDate()]).range([0, this.getSvgDimensions().width]);
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);
    this.drawXAxis();

    // Get the New Position of the Slider Viewport
    var newXStart: number = this.x(this.sliderDateTimeStart.toDate());
    var newXEnd: number = this.x(this.sliderDateTimeEnd.toDate());

    // "Snap" the Slider to the New Location
    d3.select(".viewport").transition().call(this.brush.move, [newXStart, newXEnd]);
  }

  toggleTime() {

    if (this.currentN === 15) {
      this.currentN = 30;
      this.textValue = "to 15 min";
    }
    else if (this.currentN === 30) {
      this.currentN = 15;
      this.textValue = "to 30 min";
    }

    this.toggleText.text(this.textValue);
    this.updateSliderStartEnd();
    this.moveToggleText(true);
    this.emitUpdate();
  }

  emitUpdate() {
    var intervalChanged = new IntervalChanged(this.sliderDateTimeStart, this.sliderDateTimeEnd, this.currentN);
    this.nChanged.emit(intervalChanged);
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
    d3.select(".viewport")
      .transition()
      .call(this.brush.move, [this.x(this.sliderDateTimeStart.toDate()), this.x(this.sliderDateTimeEnd.toDate())]);
    this.drawTimeSliderTicks(this.sliderDateTimeStart, this.sliderDateTimeEnd);
  }

  moveToggleText(timeToggled: boolean) {
    var selectionPosition = this.getSelectionPosition();
    var selectionDimensions = this.getSelectionDimensions();
    this.toggleText
      .transition()
      .attr("x", (d) => {
        if (timeToggled) {
          if (this.currentN === 15) {
            return this.x(this.sliderDateTimeStart.toDate()) + selectionDimensions.width / 4;
          } else if (this.currentN === 30) {
            return this.x(this.sliderDateTimeStart.toDate()) + selectionDimensions.width;
          }
        }
        return this.x(this.sliderDateTimeStart.toDate()) + selectionDimensions.width / 2;
      })
      .attr("y", (d) => {
        return selectionPosition.y + selectionDimensions.height + 10;
      });
  }

  displayToggleText(show: boolean) {
    if (show) {
      this.toggleText.classed("d-none", false);
    } else {
      setTimeout(() => {
        (function (that) {
          that.toggleText.classed("d-none", true);
        })(this);
      }, 3000);
    }
  }

  private getSelectionPosition(): SvgPosition {
    var myX = this.viewPortSelection.attr("x");
    var myY = this.viewPortSelection.attr("y");
    return new SvgPosition(+myX, +myY);
  }

  private getSelectionDimensions(): SvgDimension {
    var myWidth = this.viewPortSelection.attr("width");
    var myHeight = this.viewPortSelection.attr("height");
    return new SvgDimension(+myWidth, +myHeight);
  }

  private getSvgDimensions(): SvgDimension {
    var myWidth = this.tsSvg.style("width").replace("px", "");
    var myHeight = this.tsSvg.style("height").replace("px", "");
    return new SvgDimension(+myWidth, +myHeight);
  }
}
