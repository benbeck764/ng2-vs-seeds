import { Component, OnInit, OnChanges, ElementRef, ViewEncapsulation, EventEmitter, Input, Output, SimpleChange } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import { DateTimeFrame, IntervalChanged } from "../parent/parent.component";

export class SvgDimension {
  width: number;
  height: number;
  constructor(svgWidth, svgHeight) {
    this.width = svgWidth;
    this.height = svgHeight;
  }
}

export class SvgPosition {
  x: number;
  y: number;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class DataPoint {
  public timestamp: moment.Moment;
  public value: number;

  constructor(timeStamp?: moment.Moment, value?: number) {
    this.timestamp = timeStamp ? timeStamp: moment();
    this.value = value ? value: null;
  }
}

export class HbDataPoint extends DataPoint {
  public colorIndex: number;

  constructor(colorIndex, dataPoint?: DataPoint) {
    dataPoint ? super(dataPoint.timestamp, dataPoint.value) : super();
    this.colorIndex = colorIndex;
  }
}

@Component({
  selector: 'pg-heartrate',
  templateUrl: './heartrate.component.html',
  styleUrls: ['./heartrate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeartrateComponent implements OnInit, OnChanges {

  @Input() n: number = 15;
  @Input() newXTimeFrame: DateTimeFrame;
  @Output() timeIncremented = new EventEmitter<moment.Moment>();

  @Output() hbDataUpdated = new EventEmitter<HbDataPoint[]>();
  @Output() uaDataUpdated = new EventEmitter<DataPoint>();
  private hbDataEmitCount: number = 1;
  private hbDataEmitRateSeconds: number = 16;

  private emitCount: number = 1;
  private isRealTime: boolean = true;

  private parentNativeElement: any;
  private defaultDataValue = null;
  private margin = { top: 5, right: 20, bottom: 30, left: 30 };
  private dateTimeNow = moment().subtract(this.n, 'minutes');
  private dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');

  private historicDateTimeNow: moment.Moment;
  private historicDateTimeNMins: moment.Moment;

  // Data Arrays to Hold Chart Data
  private dataFifteenMin: DataPoint[][];
  private dataThirtyMin: DataPoint[][];
  private dataAll: DataPoint[][];
  private dataUaFifteenMin;
  private dataUaThirtyMin;

  // Random Heartbeat Data Generator
  private randomHb1 = d3.randomNormal(0, 2.5);
  private randomHb2 = d3.randomNormal(0, 2.5);
  private randomHb3 = d3.randomNormal(0, 2.5);
  private randomHb4 = d3.randomNormal(0, 2.5);
  private hb1Start = 127;
  private hb2Start = 142;
  private hb3Start = 157;
  private hb4Start = 172;
  private ticksPerSecondHb = 4;
  //private ticksPerSecondHb = 1;

  // Heartbeat SVG & Chart Configuration
  private yMin = 30;
  private yMax = 240;
  private hbSvg;
  private svgWidth = 1650;
  private svgHeight = 300;
  private g;
  private gridG;
  private pathsG;
  private width = this.svgWidth /*- this.margin.left - this.margin.right*/;
  private height = this.svgHeight /*- this.margin.top - this.margin.bottom*/;
  private lineCount = 4;
  private colors = ["purple", "blue", "green", "red"];
  private x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
  private y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);
  private line;
  private halfMarker = () => { return this.n === 15 ? 9 : this.n === 30 ? 15 : this.defaultDataValue };

  // Random Uterine Activity Data Generator
  private randomUa = d3.randomUniform(25, 95);
  private ticksPerSecondUa = 1;
  //private ticksPerSecondUa = (1/4);

  // Uterine Activity SVG & Chart Configuration
  private uaSvg;
  private svgWidthUa = 1650;
  private svgHeightUa = 150;
  private gUa;
  private gridGUa;
  private pathsGUa;
  private widthUa = this.svgWidthUa /*- this.margin.left - this.margin.right*/;
  private heightUa = this.svgHeightUa /*- this.margin.top - this.margin.bottom*/;
  private xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.widthUa]);
  private yUa = d3.scaleLinear().domain([0, 100]).range([this.heightUa, 0]);
  private lineUa;

  // Variables For Tracking, Plotting, and Illustrating Individual Baby Heartbeats
  private baby1bpm;
  private baby2bpm;
  private baby3bpm;
  private baby4bpm;
  private baby1ticked = false;
  private baby2ticked = false;
  private baby3ticked = false;
  private baby4ticked = false;

  constructor(private _element: ElementRef) {
    this.parentNativeElement = _element.nativeElement;
  }

  initHeartBeatGraph(): void {

    // Initialize Data Array w/ Default Values (null)
    this.dataFifteenMin = new Array(this.lineCount);
    this.dataThirtyMin = new Array(this.lineCount);
    this.dataAll = new Array(this.lineCount);
    for (var i = 0; i < this.lineCount; i++) {
      this.dataFifteenMin[i] = d3.range(this.n * this.ticksPerSecondHb * 60).map(d => new DataPoint());
      this.dataThirtyMin[i] = d3.range(this.n * this.ticksPerSecondHb * 60 * 2).map(d => new DataPoint());

      // TODO -- Adjust this array to whatever size it should be for testing purposes
      this.dataAll[i] = d3.range(this.n * this.ticksPerSecondHb * 60 * 2).map(d => new DataPoint());
    }

    // Create SVG and Bind Data 
    d3.selectAll("svg").data([]).exit().remove();

    this.hbSvg = d3.select("#heartrate-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.svgHeight);

    d3.selectAll("#heartrate-chart > svg")
      .data(this.dataFifteenMin).enter();

    d3.selectAll("svg")
      .attr("data-idx", d => d);

    // Setup Initial ViewBox and add Responsive Container to SVG
    d3.selectAll("svg")
      .attr('viewBox', '0 0 ' + this.getHBSvgDimensions().width + ' ' + (this.getHBSvgDimensions().height + this.margin.bottom))
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    this.g = this.hbSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // Setup Initial X & Y Axis Scales
    this.width = this.getHBSvgDimensions().width;
    this.height = this.getHBSvgDimensions().height;
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
    this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);

    // Setup HeartBeat Line
    this.line = d3.line()
      .curve(d3.curveBasis)
      .defined((d: DataPoint) => d.value !== null)
      .x((d: DataPoint, i) => {
        return this.x(d.timestamp.toDate());
      })
      .y((d: DataPoint, i) => {
        return this.y(d.value);
      });

    // Create Surrounding Clip Path
    this.g.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.height);

    this.gridG = this.g.append("g")
      .attr("class", "grid-lines-g");

    this.pathsG = this.g.append("g")
      .attr("class", "hb-paths-g");

    // Add Shaded Area Between 120/180 BPM
    this.gridG.append("g")
      .append("rect")
      .attr("class", "bpm-shaded")
      .attr("x", this.x(this.dateTimeNow.toDate()))
      .attr("y", this.y(180))
      .attr("width", this.width)
      .attr("height", this.y(120) - this.y(180))
      .attr("fill", "#f6f6f6");

    this.drawXAxes(null);

    // Add X-Axis Minor Gridlines - Vertical
    this.gridG.append("g")
      .attr("class", "grid hb-minor-x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeSecond.every(10))
        .tickSize(-(this.height), 1, 0)
        .tickFormat("")
    );

    // Add Y-Axis Minor Gridlines - Horizontal
    this.gridG.append("g")
      .attr("class", "grid hb-minor-y")
      .call(d3.axisLeft(this.y)
        .ticks(24)
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add X-Axis Major Gridlines - Vertical
    this.gridG.append("g")
      .attr("class", "grid-thick hb-major-x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeMinute.every(1))
        .tickSize(-(this.height), 1, 1)
        .tickFormat("")
    );

    // Add Y-Axis Major Gridlines - Horizontal
    this.gridG.append("g")
      .attr("class", "grid-thick hb-major-y")
      .call(d3.axisLeft(this.y)
        .tickValues([30, 60, 120, 180, 240])
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add Y Axes (HeartBeat BPM Axes)
    for (var a = 0; a <= this.n; a += 3) {
      this.gridG.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + this.x(this.dateTimeNow.clone().add(a, 'minutes').toDate()) + "," + 0 + ")")
        .call(d3.axisLeft(this.y).tickValues([30, 60, 90, 120, 150, 180, 210, 240])
          .tickSize(0, 0, 0));
    }
  }

  initUterineActivityGraph(): void {

    // Initialize Data Array w/ Default Values (-1)
    this.dataUaFifteenMin = new Array(this.n);
    for (var i = 0; i < (this.n * this.ticksPerSecondUa * 60); i++) {
      this.dataUaFifteenMin[i] = this.defaultDataValue;
    }

    this.dataUaThirtyMin = new Array(this.n * 2);
    for (var i = 0; i < (this.n * this.ticksPerSecondUa * 60 * 2); i++) {
      this.dataUaThirtyMin[i] = this.defaultDataValue;
    }

    this.uaSvg = d3.select("#uterine-activity-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.svgHeightUa);

    d3.selectAll("#uterine-activity-chart > svg")
      .data(this.dataUaFifteenMin).enter();

    // Setup Initial ViewBox and add Responsive Container to SVG
    this.uaSvg
      .attr('viewBox', '0 0 ' + this.getUASvgDimensions().width + ' ' + (this.getUASvgDimensions().height + (this.margin.bottom / 2)))
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    this.gUa = this.uaSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // Setup Initial X & Y Axis Scales
    this.widthUa = this.getUASvgDimensions().width;
    this.heightUa = this.getUASvgDimensions().height;
    this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.widthUa]);
    this.yUa = d3.scaleLinear().domain([0, 100]).range([this.heightUa, 0]);

    // Setup UA Line
    this.lineUa = d3.line()
      .curve(d3.curveBasis)
      .defined((d) => d !== null)
      .x((d, i) => {
        var startingTime = this.dateTimeNow.clone();
        var time = startingTime.add(i, 'seconds').toDate();
        return this.xUa(time);
      })
      .y((d, i) => this.yUa(d)
    );

    this.gUa.append("defs").append("clipPath")
      .attr("id", "ua-clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.heightUa);

    this.gridGUa = this.gUa.append("g")
      .attr("class", "grid-lines-g");

    this.pathsGUa = this.gUa.append("g")
      .attr("class", "ua-paths-g");

    // Add X-Axis Minor Gridlines - Vertical
    this.gridGUa.append("g")
      .attr("class", "grid ua-minor-x")
      .attr("transform", "translate(0," + this.heightUa + ")")
      .call(d3.axisBottom(this.xUa)
        .ticks(d3.timeSecond.every(10))
        .tickSize(-(this.heightUa), 1, 0)
        .tickFormat("")
      );

    // Add Y-Axis Minor Gridlines - Horizontal
    this.gridGUa.append("g")
      .attr("class", "grid ua-minor-y")
      .call(d3.axisLeft(this.yUa)
        .ticks(10)
        .tickSize(-(this.widthUa), 1, 1)
        .tickFormat("")
      );

    // Add X-Axis Major Gridlines - Vertical
    this.gridGUa.append("g")
      .attr("class", "grid-thick ua-major-x")
      .attr("transform", "translate(0," + this.heightUa + ")")
      .call(d3.axisBottom(this.xUa)
        .ticks(d3.timeMinute.every(1))
        .tickSize(-(this.heightUa), 1, 1)
        .tickFormat("")
      );

    // Add Y-Axis Major Gridlines - Horizontal
    this.gridGUa.append("g")
      .attr("class", "grid-thick ua-major-y")
      .call(d3.axisLeft(this.yUa)
        .tickValues([0, 50, 100])
        .tickSize(-(this.widthUa), 1, 1)
        .tickFormat("")
    );

    // Add Y Axes (UA [0-100] Axes)
    for (var a = 0; a <= this.n; a += 3) {
      this.gUa.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + this.x(this.dateTimeNow.clone().add(a, 'minutes').toDate()) + "," + 0 + ")")
        .call(d3.axisLeft(this.yUa).tickValues([0, 25, 50, 75, 100])
          .tickSize(0, 0, 0));
    }
  }

  redrawGridlines(interval: IntervalChanged): void {
    this.g.selectAll(".axis--y").data([]).exit().remove();
    this.g.selectAll(".hb-major-x, .hb-major-y").data([]).exit().remove();
    this.g.selectAll(".hb-minor-x, .hb-minor-y").data([]).exit().remove();
    this.g.selectAll(".bpm-shaded").remove();
    this.gUa.selectAll("defs").remove();
    this.gUa.selectAll(".axis--y").data([]).exit().remove();
    this.gUa.selectAll(".ua-major-x, .ua-major-y").data([]).exit().remove();
    this.gUa.selectAll(".ua-minor-x, .ua-minor-y").data([]).exit().remove();

    // Re-Append HB/UA Graph ClipPaths
    this.g.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.getHBSvgDimensions().height);

    this.gUa.append("defs").append("clipPath")
      .attr("id", "ua-clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.getUASvgDimensions().height);

    // Set Tick Values
    var tickValuesXMajor = d3.range(0, interval.newN).map(d => {
      return interval.startDateTime.clone().add(d, 'minutes').toDate();
    });

    var tickValuesXMinor = d3.range(0, interval.newN * 6).map(d => {
      return interval.startDateTime.clone().add(d * 10, 'seconds').toDate();
    });

    // Add Shaded Area Between 120/180 BPM
    this.gridG.append("g")
      .append("rect")
      .attr("class", "bpm-shaded")
      .attr("x", this.x(interval.startDateTime.toDate()))
      .attr("y", this.y(180))
      .attr("width", this.width)
      .attr("height", this.y(120) - this.y(180))
      .attr("fill", "#f6f6f6");

    // Add X-Axis Minor Gridlines - Vertical (HB)
    this.gridG.append("g")
      .attr("class", "grid hb-minor-x")
      .attr("transform", "translate(0," + (this.getHBSvgDimensions().height) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues(tickValuesXMinor)
        .tickSize(-(this.getHBSvgDimensions().height), 1, 0)
        .tickFormat("")
    );

    // Add X-Axis Minor Gridlines - Vertical (UA)
    this.gridGUa.append("g")
      .attr("class", "grid ua-minor-x")
      .attr("transform", "translate(0," + (this.getUASvgDimensions().height) + ")")
      .call(d3.axisBottom(this.xUa)
        .tickValues(tickValuesXMinor)
        .tickSize(-(this.getUASvgDimensions().height), 1, 0)
        .tickFormat("")
      );

    // Add X-Axis Major Gridlines - Vertical (HB)
    this.gridG.append("g")
      .attr("class", "grid-thick hb-major-x")
      .attr("transform", "translate(0," + (this.getHBSvgDimensions().height) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([interval.endDateTime.toDate()].concat(tickValuesXMajor))
        .tickSize(-(this.getHBSvgDimensions().height), 1, 1)
        .tickFormat("")
    );

    // Add X-Axis Major Gridlines - Vertical (UA)
    this.gridGUa.append("g")
      .attr("class", "grid-thick ua-major-x")
      .attr("transform", "translate(0," + (this.getUASvgDimensions().height) + ")")
      .call(d3.axisBottom(this.xUa)
        .tickValues([interval.endDateTime.toDate()].concat(tickValuesXMajor))
        .tickSize(-(this.getUASvgDimensions().height), 1, 1)
        .tickFormat("")
    );

    // Add Y-Axis Minor Gridlines - Horizontal (UA)
    this.gridGUa.append("g")
      .attr("class", "grid ua-minor-y")
      .call(d3.axisLeft(this.yUa)
        .ticks(10)
        .tickSize(-(this.widthUa), 1, 1)
        .tickFormat("")
      );

    // Add Y-Axis Major Gridlines - Horizontal (UA)
    this.gridGUa.append("g")
      .attr("class", "grid-thick ua-major-y")
      .call(d3.axisLeft(this.yUa)
        .tickValues([0, 50, 100])
        .tickSize(-(this.widthUa), 1, 1)
        .tickFormat("")
    );

    // Add Y-Axis Minor Gridlines - Horizontal (HB)
    this.gridG.append("g")
      .attr("class", "grid hb-minor-y")
      .call(d3.axisLeft(this.y)
        .ticks(24)
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add Y-Axis Major Gridlines - Horizontal (HB)
    this.gridG.append("g")
      .attr("class", "grid-thick hb-major-y")
      .call(d3.axisLeft(this.y)
        .tickValues([30, 60, 120, 180, 240])
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add Y Axes (HeartBeat BPM Axes & UA Axes)
    for (var a = 0; a <= interval.newN; a += 3) {
      this.gridG.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + this.x(interval.startDateTime.clone().add(a, 'minutes').toDate()) + "," + 0 + ")")
        .call(d3.axisLeft(this.y).tickValues([30, 60, 90, 120, 150, 180, 210, 240])
          .tickSize(0, 0, 0));

      this.gridGUa.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + this.xUa(interval.startDateTime.clone().add(a, 'minutes').toDate()) + "," + 0 + ")")
        .call(d3.axisLeft(this.yUa).tickValues([0, 25, 50, 75, 100])
          .tickSize(0, 0, 0));
    }
  }

  drawXAxes(newDateTimeFrame: DateTimeFrame): void {

    // Remove old X-Axes
    this.g.selectAll(".axis--x").data([]).exit().remove();

    // Need to draw X-Axes accordingly to what mode we're in.
    var start = this.dateTimeNow.clone();
    var end = this.dateTimeNMins.clone();

    if (newDateTimeFrame !== null/*!this.isRealTime*/) {
      start = newDateTimeFrame.startDateTime;
      end = newDateTimeFrame.endDateTime;
    }

    // Set Tick Values
    var tickValues = d3.range(3, this.n, 3).map(d => {
      if (d !== this.halfMarker() && d % 3 === 0) {
        return start.clone().add(d, 'minutes').toDate();
      }
    });

    // Remove Empty ("Falsey") Tick Value(s)
    tickValues = tickValues.filter(Boolean);

    // Add X-Axis (Interval Ticks)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (this.y(this.yMin)) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([start.toDate(), end.toDate()].concat(tickValues))
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(0, 1, 0)
    );

    // Add X-Axis (Middle Interval Tick)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (this.y(this.yMin)) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([
          start.clone().add(this.halfMarker(), 'minutes').toDate()
        ])
        .tickFormat(d3.timeFormat("%I:%M %d %b, %Y"))
        .tickSize(0, 1, 0)
    );
  }

  ngOnInit(): void {
    console.log('Heartrate Component');
    this.n = 15;

    // Initialize Component Graphs
    this.initHeartBeatGraph();
    this.initUterineActivityGraph();

    // Tick Heartbeat Graph Data every 250 milliseconds
    for (var i = 0; i < this.lineCount; i++) {
      var myData = this.dataFifteenMin[i];
      var it = this.pathsG.append("g")
        .attr("clip-path", "url(#clip)")
        .append("path")
          .data([myData])
          .attr("class", "line " + this.colors[i] + "-line")
          .attr("data-color-idx", i)
        .transition()
        .duration(1000 / this.ticksPerSecondHb)
          .ease(d => d3.easeLinear(d))
          .on("start", (dataArray, index, d3Element) => {
            this.tick(d3Element[0]);
          });
    }

    // Tick Uterine Activity Graph Data every 1000 milliseconds
    var myDataUa = this.dataUaFifteenMin;
    var it = this.pathsGUa.append("g")
      .attr("clip-path", "url(#ua-clip)")
      .append("path")
        .data([myDataUa])
        .attr("class", "line grey-line")
      .transition()
        .duration(1000 / this.ticksPerSecondUa)
        .ease(d => d3.easeLinear(d))
      .on("start", (dataArray, index, d3Element) => {
          this.tickUa(d3Element[0]);
      });
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }): void {
    var newN = changes['n'];
    if (typeof (newN) !== "undefined" && typeof (newN.currentValue) !== "undefined") {
      if (!newN.firstChange) { this.toggleInterval(newN.currentValue); }
    }

    var newXTimeFrame = changes['newXTimeFrame'];
    if (typeof (newXTimeFrame) !== "undefined" && typeof (newXTimeFrame.currentValue) !== "undefined") {
      if (!newXTimeFrame.firstChange) { this.toggleXAxis(newXTimeFrame.currentValue); }
    }
  }

  tick(d3Element): void {

    var selectedActive = d3.active(d3Element);
    if (selectedActive == null) { return; }

    var selectedg = d3.select(d3Element);
    var colorIdx = parseInt(selectedg.attr("data-color-idx"));

    var myData15 = this.dataFifteenMin[colorIdx];
    var myData30 = this.dataThirtyMin[colorIdx];
    var myDataAll = this.dataAll[colorIdx];
    if (myData15 === undefined || myData30 === undefined || myDataAll === undefined) return;

    // Configure New Heartbeat Data "Randomly" For Each Baby
    var newData = this.defaultDataValue;
    switch (colorIdx) {
      case 0:
        newData = this.randomHb1() + this.hb1Start;
        break;
      case 1:
        newData = this.randomHb2() + this.hb2Start;
        break;
      case 2:
        newData = this.randomHb3() + this.hb3Start;
        break;
      case 3:
        newData = this.randomHb4() + this.hb4Start;
        break;
      default:
        break;
    }

    var datapoint = new DataPoint();
    datapoint.timestamp = this.dateTimeNMins;
    datapoint.value = newData;

    myData15.push(datapoint);
    myData30.push(datapoint);
    myDataAll.push(datapoint);

    this.updateBpm(newData, colorIdx);

    selectedg.attr("d", this.line);

    selectedActive
      // TODO -- Do I even need this?
      //.attr("transform", "translate(" + this.x(this.dateTimeNow.toDate()) + ",0)")
      .transition()
        .on("start", (dataArray, index, d3Element) => {
          this.tick(d3Element[0]);
        }
    );

    this.updateTimeScale(colorIdx);
  
    myData15.shift();
    myData30.shift();
  }

  tickUa(d3Element): void {

    var selectedActive = d3.active(d3Element);
    if (selectedActive == null) { return; }

    var selectedg = d3.select(d3Element);
    var myData15 = this.dataUaFifteenMin;
    var myData30 = this.dataUaThirtyMin;
    var newData = this.randomUa();
    myData15.push(newData);
    myData30.push(newData);

    selectedg.attr("d", this.lineUa).attr("transform", null);
    selectedActive.attr("transform", "translate(" + this.xUa(this.dateTimeNow.toDate()) + ",0)")
      .transition().on("start", (dataArray, index, d3Element) => {
        this.tickUa(d3Element[0]);
      });

    myData15.shift();
    myData30.shift();
  }

  updateTimeScale(colorIndex): void {

    // Ensure a full tick (1 tick per each baby heartbeat) has occurred
    switch (colorIndex) {
      case 0:
        this.baby1ticked = true;
        break;
      case 1:
        this.baby2ticked = true;
        break;
      case 2:
        this.baby3ticked = true;
        break;
      case 3:
        this.baby4ticked = true;
        break;
      default:
        break;
    }

    if (this.baby1ticked && this.baby2ticked && this.baby3ticked && this.baby4ticked) {
      this.baby1ticked = false;
      this.baby2ticked = false;
      this.baby3ticked = false;
      this.baby4ticked = false;

      // Send the HB data to Compressed View (every 16 [configurable] seconds)
      if ((this.hbDataEmitCount / this.ticksPerSecondHb) % this.hbDataEmitRateSeconds === 0) {
        this.emitHbData();
        this.hbDataEmitCount = 1;
      }
      this.hbDataEmitCount++;

      this.redrawTimeScale();
    }
  }

  emitHbData() {
    // Get the latest data from each array
    var dataPoints: HbDataPoint[] = [];
    for (var i = 0; i < this.lineCount; i++) {
      var lastDataPoint = this.dataAll[i][this.dataAll[i].length -  1];
      var hbDataPoint = new HbDataPoint(i, lastDataPoint);
      dataPoints.push(hbDataPoint);     
    }
    this.hbDataUpdated.emit(dataPoints);
  }

  redrawTimeScale(): void {

    // Update Current Time & Time Scales
    this.dateTimeNow.add(250, 'milliseconds');
    this.dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');

    // Only update the X-Axis Scales if we are in Real-Time Mode, otherwise just increment time forward for plotting
    if (this.isRealTime) {
      this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
      this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
    }
    
    // Don't emit this every 250ms, instead emit every (4) seconds
    if(this.isRealTime) {
      if (this.emitCount % 16 === 0) {
        this.timeIncremented.emit(this.dateTimeNMins);
        this.emitCount = 1;
      } else {
        this.emitCount++;
      }
    }

    // Re-Draw the X-Axes if we're in Real-Time Mode (keeps chart moving forward)
    if (this.isRealTime) {
      this.drawXAxes(null);
    }
  }

  updateBpm(dataPoint, colorIndex): void {
    switch (colorIndex) {
      case 0:
        this.baby1bpm = Math.round(dataPoint);
        break;
      case 1:
        this.baby2bpm = Math.round(dataPoint);
        break;
      case 2:
        this.baby3bpm = Math.round(dataPoint);
        break;
      case 3:
        this.baby4bpm = Math.round(dataPoint);
        break;
      default:
        break;
    }
  }

  toggleXAxis(newDateTimeFrame: DateTimeFrame): void {

    // Find out if we're in Real-Time Mode or not from the emitted DateTimeFrame
    this.isRealTime = newDateTimeFrame.isRealTime;

    var start: moment.Moment;
    var end: moment.Moment;
    // We need to make real-time actually be real-time now
    if (this.isRealTime) {
      // Current-Time set to exact time now (moment())
      this.dateTimeNMins = moment();
      this.dateTimeNow = this.dateTimeNMins.clone().subtract(this.n, 'minutes');

      start = this.dateTimeNow.clone();
      end = this.dateTimeNMins.clone();
    } else {
      // Set Global Historic Time Values
      this.historicDateTimeNow = newDateTimeFrame.startDateTime;
      this.historicDateTimeNMins = newDateTimeFrame.endDateTime;

      // Set Time Variables to new DateTimeFrame
      start = newDateTimeFrame.startDateTime;
      end = newDateTimeFrame.endDateTime;
    }

    // Reset Time Scales
    this.x = d3.scaleTime().domain([start.toDate(), end.toDate()]).range([0, this.width]);
    this.xUa = d3.scaleTime().domain([start.toDate(), end.toDate()]).range([0, this.width]);

    // Re-Draw X Axes
    this.drawXAxes(newDateTimeFrame);

    // Reset Data to new DateTimeFrame if we're not in Real-Time Mode
    if (!this.isRealTime) {
      // TODO -- Remove Data Array & Replace w/ DataAll (or some historically pulled/cached data [?])

      // TODO -- This isn't actually needed? -- Probably will be when we need to swap the new data array????
      //for (var i = 0; i < this.lineCount; i++) {
      //  var selectedPath = this.g.select("path[data-color-idx='" + i + "']");
      //  selectedPath.datum([]).exit();
      //}

      // TODO -- Watermark as historic (maybe include isHistoric bool in DateTimeFrame?)
    } else {
      // Remove Data Array & Replace w/ Data 15 or Data 30 based upon current N value
      if (this.n === 15) {
        for (var i = 0; i < this.lineCount; i++) {
          var selectedPath = this.g.select("path[data-color-idx='" + i + "']");
          selectedPath.data([this.dataFifteenMin[i]]).enter();
        }
      } else if (this.n === 30) {
        for (var i = 0; i < this.lineCount; i++) {
          var selectedPath = this.g.select("path[data-color-idx='" + i + "']");
          selectedPath.data([this.dataThirtyMin[i]]).enter();
        }
      }
    }
  }

  toggleInterval(newInterval: IntervalChanged): void {
    // Reset n to new n
    this.n = newInterval.newN;

    // Reset Historic DateTimeRange Start/End
    this.historicDateTimeNow = newInterval.startDateTime;
    this.historicDateTimeNMins = newInterval.endDateTime;

    // Re-Adjust HeartBeat / UA X Time Scales
    this.reAdjustXTimeScales(newInterval);

    // Update HeartBeat / UA Path Data
    this.reAdjustHbAndUaData(this.n);

    // Re-Adjust HB SVG Size / ViewBox
    this.reAdjustHbSvgSize(this.n);

    // Re-Adjust UA SVG Size / ViewBox
    this.reAdjustUaSvgSize(this.n);

    // Remove All Gridlines from HB SVG
    this.gridG.selectAll("g").remove();

    // Remove All Gridlines from UA SVG
    this.gridGUa.selectAll("g").remove();

    // Remove the Main HB SVG Group & Re-Append (Done to re-draw the Main SVG Group with appropriate dimensions)
    var children = this.g.select(function () { return this.childNodes; });
    this.hbSvg.select("g").remove();

    var childrenUa = this.gUa.select(function () { return this.childNodes; });
    this.uaSvg.select("g").remove();

    this.g = this.hbSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.gUa = this.uaSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // TODO -- Timeframe has really changed here...
    // Re-Draw X-Axes
    this.drawXAxes(new DateTimeFrame(newInterval.startDateTime, newInterval.endDateTime, this.isRealTime));

    // TODO -- Timeframe has really changed here...    
    // Re-Draw X/Y Grid Lines
    this.redrawGridlines(newInterval);

    // Re-Append Groups
    this.g.node().appendChild(this.gridG.node());
    this.g.node().appendChild(this.pathsG.node());

    this.gUa.node().appendChild(this.gridGUa.node());
    this.gUa.node().appendChild(this.pathsGUa.node());
  }

  reAdjustHbAndUaData(n): void {
    if (n === 15) {
      var clipPathGs = this.g.selectAll("g[clip-path='url(#clip)']");
      var paths = clipPathGs.selectAll("path").data([]).exit();

      var clipPathGsUa = this.gUa.selectAll("g[clip-path='url(#ua-clip)']");
      clipPathGsUa.selectAll("path").data([]).exit();
      clipPathGsUa.selectAll("path").data([this.dataUaFifteenMin]).enter();

      for (var i = 0; i < this.lineCount; i++) {
        var selectedPath = this.g.select("path[data-color-idx='" + i + "']");
        selectedPath.data([this.dataFifteenMin[i]]).enter();
      }
    } else if (n === 30) {
      var clipPathGs = this.g.selectAll("g[clip-path='url(#clip)']");
      var paths = clipPathGs.selectAll("path").data([]).exit();

      var clipPathGsUa = this.gUa.selectAll("g[clip-path='url(#ua-clip)']");
      clipPathGsUa.selectAll("path").data([]).exit();
      clipPathGsUa.selectAll("path").data([this.dataUaThirtyMin]).enter();

      for (var i = 0; i < this.lineCount; i++) {
        var selectedPath = this.g.select("path[data-color-idx='" + i + "']");
        selectedPath.data([this.dataThirtyMin[i]]).enter();
      }
    }
  }

  reAdjustXTimeScales(interval: IntervalChanged): void {
    if (interval.newN === 15) {
      this.dateTimeNow = this.dateTimeNow.add(15, 'minutes');
      this.dateTimeNMins = this.dateTimeNow.clone().add(interval.newN, 'minutes');
      this.x = d3.scaleTime().domain([interval.startDateTime.toDate(), interval.endDateTime.toDate()]).range([0, this.getHBSvgDimensions().width]);
      this.xUa = d3.scaleTime().domain([interval.startDateTime.toDate(), interval.endDateTime.toDate()]).range([0, this.getUASvgDimensions().width]);
    } else if (interval.newN === 30) {
      this.dateTimeNow = this.dateTimeNow.subtract(15, 'minutes');
      this.dateTimeNMins = this.dateTimeNow.clone().add(interval.newN, 'minutes');
      this.x = d3.scaleTime().domain([interval.startDateTime.toDate(), interval.endDateTime.toDate()]).range([0, this.getHBSvgDimensions().width]);
      this.xUa = d3.scaleTime().domain([interval.startDateTime.toDate(), interval.endDateTime.toDate()]).range([0, this.getUASvgDimensions().width]);
    }
  }

  reAdjustHbSvgSize(n): void {
    if (n === 15) {
      var svgContainerHb = this.hbSvg.select(function () { return this.parentNode; });
      svgContainerHb.remove();

      this.hbSvg = d3.select("#heartrate-chart")
        .style("height", this.svgHeight + "px")
        .append("div")
        .classed("svg-container", true) //container class to make it responsive
        .style("height", this.svgHeight + "px")
        .append("svg")
        .attr("width", "100%")
        .attr("height", this.svgHeight);

      this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.getHBSvgDimensions().height, 0]);

      this.hbSvg
        .attr('viewBox', '0 0 ' + this.getHBSvgDimensions().width + ' ' + (this.getHBSvgDimensions().height + this.margin.bottom)) 
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .classed("svg-content-responsive", true);

      this.hbSvg.node().appendChild(this.g.node());
    }
    else if (n === 30) {
      var svgContainerHb = this.hbSvg.select(function () { return this.parentNode; });
      svgContainerHb.remove();

      this.hbSvg = d3.select("#heartrate-chart")
        .style("height", (this.svgHeight / 2) + "px")
        .append("div")
        .classed("svg-container", true) //container class to make it responsive
        .style("height", (this.svgHeight / 2) + "px")
        .append("svg")
        .attr("width", "100%")
        .attr("height", (this.svgHeight / 2));

      this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.getHBSvgDimensions().height, 0]);

      this.hbSvg
        .attr('viewBox', '0 0 ' + this.getHBSvgDimensions().width + ' ' + (this.getHBSvgDimensions().height + this.margin.bottom)) 
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .classed("svg-content-responsive", true);

      this.hbSvg.node().appendChild(this.g.node());
    }
  }

  reAdjustUaSvgSize(n): void {
    if (n === 15) {
      var svgContainerUa = this.uaSvg.select(function () { return this.parentNode; });
      svgContainerUa.remove();

      this.uaSvg = d3.select("#uterine-activity-chart")
        .style("height", this.svgHeightUa + "px")
        .append("div")
        .classed("svg-container", true) //container class to make it responsive
        .style("height", this.svgHeightUa + "px")
        .append("svg")
        .attr("width", "100%")
        .attr("height", this.svgHeightUa);

      d3.selectAll("#uterine-activity-chart > svg")
        .data(this.dataUaFifteenMin).enter();

      this.yUa = d3.scaleLinear().domain([0, 100]).range([this.getUASvgDimensions().height, 0]);

      this.uaSvg
        .attr('viewBox', '0 0 ' + this.getUASvgDimensions().width + ' ' + (this.getUASvgDimensions().height + (this.margin.bottom / 2)))
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .classed("svg-content-responsive", true);

      this.uaSvg.node().appendChild(this.gUa.node());
    }
    else if (n === 30) {
      var svgContainerUa = this.uaSvg.select(function () { return this.parentNode; });
      svgContainerUa.remove();

      this.uaSvg = d3.select("#uterine-activity-chart")
        .style("height", (this.svgHeightUa / 2) + "px")
        .append("div")
        .classed("svg-container", true) //container class to make it responsive
        .style("height", (this.svgHeightUa / 2) + "px")
        .append("svg")
        .attr("width", "100%")
        .attr("height", (this.svgHeightUa / 2));

      d3.selectAll("#uterine-activity-chart > svg")
        .data(this.dataUaThirtyMin).enter();

      this.yUa = d3.scaleLinear().domain([0, 100]).range([this.getUASvgDimensions().height, 0]);

      this.uaSvg
        .attr('viewBox', '0 0 ' + this.getUASvgDimensions().width + ' ' + (this.getUASvgDimensions().height + (this.margin.bottom / 2)))
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .classed("svg-content-responsive", true);

      this.uaSvg.node().appendChild(this.gUa.node());
    }
  }

  private getHBSvgDimensions() : SvgDimension {
    var myWidthHb = this.hbSvg.style("width").replace("px", "");
    var myHeightHb = this.hbSvg.style("height").replace("px", "");
    return new SvgDimension(+myWidthHb, +myHeightHb);
  }

  private getUASvgDimensions(): SvgDimension {
    var myWidthUa = this.uaSvg.style("width").replace("px", "");
    var myHeightUa = this.uaSvg.style("height").replace("px", "");
    return new SvgDimension(+myWidthUa, +myHeightUa);
  }
}
