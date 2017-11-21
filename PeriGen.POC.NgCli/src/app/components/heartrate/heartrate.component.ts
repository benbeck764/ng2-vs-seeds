import { Component, OnInit, OnChanges, ElementRef, ViewEncapsulation, Input, SimpleChange } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';

@Component({
  selector: 'pg-heartrate',
  templateUrl: './heartrate.component.html',
  styleUrls: ['./heartrate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeartrateComponent implements OnInit, OnChanges {

  @Input() n: number = 15;
  private firstEmit: boolean = true;

  private parentNativeElement: any;
  private defaultDataValue = -1;
  private halfMarker = this.n === 15 ? 9 : this.n === 30 ? 15 : this.defaultDataValue;
  private margin = { top: 20, right: 20, bottom: 20, left: 30 };
  private dateTimeNow = moment().startOf('minute').subtract(this.n, 'minutes');
  private dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');

  // Data Arrays to Hold Chart Data
  private dataFifteenMin;
  private dataThirtyMin;
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

  // Heartbeat SVG & Chart Configuration
  private yMin = 30;
  private yMax = 240;
  private hbSvg;
  private svgWidth = 1650;
  private svgHeight = 300;
  private g;
  private width = this.svgWidth - this.margin.left - this.margin.right;
  private height = this.svgHeight - this.margin.top - this.margin.bottom;
  private lineCount = 4;
  private colors = ["purple", "blue", "green", "red"];
  private x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
  private y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);
  private line;

  // Random Uterine Activity Data Generator
  private randomUa = d3.randomUniform(25, 95);
  private ticksPerSecondUa = 1;

  // Uterine Activity SVG & Chart Configuration
  private uaSvg;
  private svgWidthUa = 1650;
  private svgHeightUa = 150;
  private gUa;
  private widthUa = this.svgWidthUa - this.margin.left - this.margin.right;
  private heightUa = this.svgHeightUa - this.margin.top - this.margin.bottom;
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

  initHeartBeatGraph() {

    // Initialize Data Array w/ Default Values (-1)
    this.dataFifteenMin = new Array(this.lineCount);
    this.dataThirtyMin = new Array(this.lineCount);
    for (var i = 0; i < this.lineCount; i++) {
      this.dataFifteenMin[i] = d3.range(this.n * this.ticksPerSecondHb * 60).map(d => this.defaultDataValue);
      this.dataThirtyMin[i] = d3.range(this.n * this.ticksPerSecondHb * 60 * 2).map(d => this.defaultDataValue);
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
    var myWidth = d3.selectAll("svg").style("width").replace("px", "");
    var myHeight = d3.selectAll("svg").style("height").replace("px", "");

    d3.selectAll("svg")
      .attr('viewBox', '0 0 ' + +myWidth + ' ' + (+myHeight + this.margin.bottom))
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    this.g = this.hbSvg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // Setup Initial X & Y Axis Scales
    this.width = myWidth - this.margin.left - this.margin.right;
    this.height = myHeight - this.margin.top - this.margin.bottom;
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
    this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);

    // Setup HeartBeat Line
    this.line = d3.line()
      .curve(d3.curveBasis)
      .x((d, i) => {
        var startingTime = this.dateTimeNow.clone();
        var time = startingTime.add(i * 250, 'milliseconds').toDate();
        return this.x(time);
      })
      .y((d, i) => this.y(d)
      );

    // Create HeartBeat Line Area
    this.g.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.height);

    // Add Shaded Area Between 120/180 BPM
    this.g.append("g")
      .append("rect")
      .attr("x", this.x(this.dateTimeNow.toDate()))
      .attr("y", this.y(180))
      .attr("width", this.width)
      .attr("height", this.y(120) - this.y(180))
      .attr("fill", "#f6f6f6");

    this.drawXAxes();

    // Add X-Axis Minor Gridlines - Vertical
    this.g.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeSecond.every(10))
        .tickSize(-(this.height), 1, 0)
        .tickFormat("")
    );

    // Add Y-Axis Minor Gridlines - Horizontal
    this.g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(this.y)
        .ticks(24)
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add X-Axis Major Gridlines - Vertical
    this.g.append("g")
      .attr("class", "grid-thick hb-major-x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .ticks(d3.timeMinute.every(1))
        .tickSize(-(this.height), 1, 1)
        .tickFormat("")
    );

    // Add Y-Axis Major Gridlines - Horizontal
    this.g.append("g")
      .attr("class", "grid-thick")
      .call(d3.axisLeft(this.y)
        .tickValues([30, 60, 120, 180, 240])
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // Add Y Axes (HeartBeat BPM Axes)
    for (var a = 0; a <= this.n; a += 3) {
      this.g.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + this.x(this.dateTimeNow.clone().add(a, 'minutes').toDate()) + "," + 0 + ")")
        .call(d3.axisLeft(this.y).tickValues([30, 60, 90, 120, 150, 180, 210, 240])
          .tickSize(0, 0, 0));
    }
  }

  initUterineActivityGraph() {

    // Initialize Data Array w/ Default Values (-1)
    this.dataUaFifteenMin = new Array(this.n);
    for (var i = 0; i < (this.n * this.ticksPerSecondUa * 60); i++) {
      this.dataUaFifteenMin[i] = this.defaultDataValue;
    }

    this.dataUaThirtyMin = new Array(this.n * 2);
    for (var i = 0; i < (this.n * this.ticksPerSecondUa * 60 * 2); i++) {
      this.dataUaThirtyMin[i] = this.defaultDataValue;
    }

    var svg = d3.select("#uterine-activity-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.svgHeightUa);

    d3.selectAll("#uterine-activity-chart > svg")
      .data(this.dataUaFifteenMin).enter();

    // Setup Initial ViewBox and add Responsive Container to SVG
    var myWidth = svg.style("width").replace("px", "");
    var myHeight = svg.style("height").replace("px", "");

    svg
      .attr('viewBox', '0 0 ' + +myWidth + ' ' + (+myHeight + 10)) // TODO fix this + 10 magic
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    this.gUa = svg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + /*this.margin.top*/5 + ")"); // TODO fix this magic

    // Setup Initial X & Y Axis Scales
    this.widthUa = myWidth - this.margin.left - this.margin.right;
    this.heightUa = myHeight - this.margin.top - this.margin.bottom;
    this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.widthUa]);
    this.yUa = d3.scaleLinear().domain([0, 100]).range([this.heightUa, 0]);

    // Setup UA Line
    this.lineUa = d3.line()
      .curve(d3.curveBasis)
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

    // Add X-Axis Minor Gridlines - Vertical
    this.gUa.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + this.heightUa + ")")
      .call(d3.axisBottom(this.xUa)
        .ticks(d3.timeSecond.every(10))
        .tickSize(-(this.heightUa), 1, 0)
        .tickFormat("")
      );

    // Add Y-Axis Minor Gridlines - Horizontal
    this.gUa.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(this.yUa)
        .ticks(10)
        .tickSize(-(this.widthUa), 1, 1)
        .tickFormat("")
      );

    // Add X-Axis Major Gridlines - Vertical
    this.gUa.append("g")
      .attr("class", "grid-thick")
      .attr("transform", "translate(0," + this.heightUa + ")")
      .call(d3.axisBottom(this.xUa)
        .ticks(d3.timeMinute.every(1))
        .tickSize(-(this.heightUa), 1, 1)
        .tickFormat("")
      );

    // Add Y-Axis Major Gridlines - Horizontal
    this.gUa.append("g")
      .attr("class", "grid-thick")
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

  drawXAxes() {

    // Set Tick Values
    var tickValues = d3.range(3, this.n, 3).map(d => {
      if (d !== this.halfMarker && d % 3 === 0) {
        return this.dateTimeNow.clone().add(d, 'minutes').toDate();
      }
    });

    // Remove Empty ("Falsey") Tick Value(s)
    tickValues = tickValues.filter(Boolean);

    // Add X-Axis (Interval Ticks)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.y(this.yMin) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()].concat(tickValues))
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(0, 1, 0)
    );

    // Add X-Axis (Middle Interval Tick)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.y(this.yMin) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([
          this.dateTimeNow.clone().add(this.halfMarker, 'minutes').toDate()
        ])
        .tickFormat(d3.timeFormat("%I:%M %d %b, %Y"))
        .tickSize(0, 1, 0)
    );
  }

  ngOnInit() {

    console.log('Heartrate Component');
    this.n = 15;
    // Initialize Component Graphs
    this.initHeartBeatGraph();
    this.initUterineActivityGraph();

    // Tick Heartbeat Graph Data every 250 milliseconds
    for (var i = 0; i < this.lineCount; i++) {
      var myg = this.hbSvg.select("g");
      var myData = this.dataFifteenMin[i];
      var it = myg.append("g")
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
    var myData = this.dataUaFifteenMin;
    var it = this.gUa.append("g")
      .attr("clip-path", "url(#ua-clip)")
      .append("path")
        .data([myData])
        .attr("class", "line grey-line")
      .transition()
        .duration(1000 / this.ticksPerSecondUa)
        .ease(d => d3.easeLinear(d))
      .on("start", (dataArray, index, d3Element) => {
          this.tickUa(d3Element[0]);
      });
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    var newN = changes['n'].currentValue;
    if (typeof(newN) === "undefined") { return; }
    console.log('ngOnChanges: ' + this.n);

    // TODO -- Call Logic Here To Update TimeScales & Graphs, etc...
    if (!this.firstEmit) { this.toggleInterval(newN); }
    this.firstEmit = false;
  }

  tick(d3Element): void {

    var selectedActive = d3.active(d3Element);
    if (selectedActive == null) { return; }

    var selectedg = d3.select(d3Element);
    var colorIdx = parseInt(selectedg.attr("data-color-idx"));

    var myData15 = this.dataFifteenMin[colorIdx];
    var myData30 = this.dataThirtyMin[colorIdx];
    if (myData15 === undefined || myData30 === undefined) return;

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
    myData15.push(newData);
    myData30.push(newData);

    this.updateBpm(newData, colorIdx);

    selectedg.attr("d", this.line).attr("transform", null);
    selectedActive.attr("transform", "translate(" + this.x(this.dateTimeNow.toDate()) + ",0)")
      .transition().on("start", (dataArray, index, d3Element) => {
        this.tick(d3Element[0]);
    });

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

      this.redrawTimeScale();
    }
  }

  redrawTimeScale(): void {

    // Update Current Time & Time Scales
    this.dateTimeNow.add(250, 'milliseconds');
    this.dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
    this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);

    // Re-Draw X Axes
    this.g.selectAll(".axis--x").data([]).exit().remove();
    this.drawXAxes();
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

  toggleInterval(newInterval: number): void {
    console.log('toggleInterval');
    this.n = newInterval;

    if (this.n === 15) {
      this.dateTimeNow = this.dateTimeNow.add(15, 'minutes');
      this.dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');
      this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
      this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);

      this.line = d3.line()
        .curve(d3.curveBasis)
        .x((d, i) => {
          var startingTime = this.dateTimeNow.clone();
          var time = startingTime.add(i * 250, 'milliseconds').toDate();
          return this.x(time);
        })
        .y((d, i) => this.y(d)
      );

      this.lineUa = d3.line()
        .curve(d3.curveBasis)
        .x((d, i) => {
          var startingTime = this.dateTimeNow.clone();
          var time = startingTime.add(i, 'seconds').toDate();
          return this.xUa(time);
        })
        .y((d, i) => this.yUa(d)
      );

    } else if (this.n === 30) {
      this.dateTimeNow = this.dateTimeNow.subtract(15, 'minutes');
      this.dateTimeNMins = this.dateTimeNow.clone().add(this.n, 'minutes');
      this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);
      this.xUa = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeNMins.toDate()]).range([0, this.width]);

      this.line = d3.line()
        .curve(d3.curveBasis)
        .x((d, i) => {
          var startingTime = this.dateTimeNow.clone();
          var time = startingTime.add((i * 250) * 2, 'milliseconds').toDate();
          return this.x(time);
        })
        .y((d, i) => this.y(d)
      );

      this.lineUa = d3.line()
        .curve(d3.curveBasis)
        .x((d, i) => {
          var startingTime = this.dateTimeNow.clone();
          var time = startingTime.add((i * 2), 'seconds').toDate();
          return this.xUa(time);
        })
        .y((d, i) => this.yUa(d)
      );


      // TODO -- WTF am I actually trying to do here!?!?
      var paths = this.g.selectAll("g[clip-path='url(#clip)'] path").data([]).exit().remove();

      for (var i = 0; i < this.lineCount; i++) {
        var myg = this.hbSvg.select("g");
        var myData = this.dataThirtyMin[i];
        var it = myg.append("g")
          .attr("clip-path", "url(#clip)")
          .append("path")
            .data([myData])
            .enter()
            .attr("class", "line " + this.colors[i] + "-line")
            .attr("data-color-idx", i)
          .transition()
            .duration(1000 / this.ticksPerSecondHb)
            .ease(d => d3.easeLinear(d))
          .on("start", (dataArray, index, d3Element) => {
            this.tick(d3Element[0]);
          });
      }
    }

    // Re-Draw X Axes
    this.g.selectAll(".axis--x").data([]).exit().remove();
    this.drawXAxes();
  }
}
