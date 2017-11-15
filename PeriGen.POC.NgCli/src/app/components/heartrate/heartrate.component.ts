import { Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';

@Component({
  selector: 'pg-heartrate',
  templateUrl: './heartrate.component.html',
  styleUrls: ['./heartrate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeartrateComponent implements OnInit {

  private parentNativeElement: any;
  private data;
  private random = d3.randomUniform(110, 190);
  private n = 15;
  private count = 1;
  private lineCount = 4;
  private ticksPerSecond = 4;
  private colors = ["purple", "blue", "green", "red"];
  private dateTimeNow = moment().startOf('minute');
  private dateTimeFifteenMins = moment().startOf('minute').add(15, 'minutes');
  private defaultDataValue = -1;

  private yMin = 30;
  private yMax = 240;
  private svgWidth = 1650;
  private svgHeight = 300;
  private margin = { top: 20, right: 20, bottom: 20, left: 30 };
  private width = this.svgWidth - this.margin.left - this.margin.right;
  private height = this.svgHeight - this.margin.top - this.margin.bottom;
  private x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeFifteenMins.toDate()]).range([0, this.width]);
  private y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);
  private g;

  private yMajorTickScale = d3.scaleLinear().domain([0, 240]).range([this.height, 0]);

  private matrix = Array.apply(null, { length: this.count }).map(Number.call, Number);

  private line = d3.line()
    .curve(d3.curveBasis)
    .x((d, i) => {
      var startingTime = this.dateTimeNow.clone();
      var time = startingTime.add(i, 'minutes').toDate();
      return this.x(time);
    })
    .y((d, i) => this.y(d)
  );

  private hold = [];

  private baby1bpm;
  private baby2bpm;
  private baby3bpm;
  private baby4bpm;

  private baby1ticked = false;
  private baby2ticked = false;
  private baby3ticked = false;
  private baby4ticked = false;

  private that = this;

  constructor(private _element: ElementRef) {
    this.parentNativeElement = _element.nativeElement;
  }

  initSvg() {

    // Remove Event Handler
    for (var i = 0; i < this.hold.length; i++) {
      var path = this.hold[i]._groups[0][0];
      path.__transition = null;
    }

    // Initialize Data Array w/ Default Values (-1)
    this.data = new Array(this.lineCount);
    for (var j = 0; j < this.lineCount; j++) {
      this.data[j] = new Array(this.count);
      for (var i = 0; i < this.count; i++) {
        this.data[j][i] = d3.range(this.n).map(d => this.defaultDataValue);
      }
    }

    // Initialize Matrix
    this.matrix = Array.apply(null, { length: this.count }).map(Number.call, Number);

    // Create SVG and Bind Data 
    d3.selectAll("svg").data([]).exit().remove();

    var svg = d3.select("#heartrate-chart")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      .attr("width", "100%")
      .attr("height", this.svgHeight);

    d3.selectAll("svg")
      .data(this.matrix)
      .enter();

    d3.selectAll("svg")
      .attr("data-idx", d => d);

    // Setup Initial ViewBox and add Responsive Container to SVG
    var myWidth = d3.selectAll("svg").style("width").replace("px", "");
    var myHeight = d3.selectAll("svg").style("height").replace("px", "");

    d3.selectAll("svg")
      .attr('viewBox', '0 0 ' + +myWidth + ' ' + (+myHeight + this.margin.bottom))
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);

    this.g = svg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // Setup Initial X & Y Axis Scales
    this.width = myWidth - this.margin.left - this.margin.right;
    this.height = myHeight - this.margin.top - this.margin.bottom;
    this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeFifteenMins.toDate()]).range([0, this.width]);
    this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);

    // Setup HeartBeat Line
    this.line = d3.line()
      .curve(d3.curveBasis)
      .x((d, i) => {
        var startingTime = this.dateTimeNow.clone();
        var time = startingTime.add(i, 'minutes').toDate();
        return this.x(time);
      })
      .y((d, i) => this.y(d)
    );
  }

  initHeartBeatGraph() {

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
      .attr("class", "grid-thick")
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

  drawXAxes() {
    // Add X-Axis (Interval Ticks)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.y(this.yMin) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([
          this.dateTimeNow.toDate(),
          this.dateTimeNow.clone().add(3, 'minutes').toDate(),
          this.dateTimeNow.clone().add(6, 'minutes').toDate(),
          this.dateTimeNow.clone().add(12, 'minutes').toDate(),
          this.dateTimeFifteenMins.toDate()
        ])
        .tickFormat(d3.timeFormat("%I:%M"))
        .tickSize(0, 1, 0)
      );

    // Add X-Axis (Middle Interval Tick)
    this.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.y(this.yMin) + ")")
      .call(d3.axisBottom(this.x)
        .tickValues([
          this.dateTimeNow.clone().add(9, 'minutes').toDate()
        ])
        .tickFormat(d3.timeFormat("%I:%M %d %b, %Y"))
        .tickSize(0, 1, 0)
      );
  }

  ngOnInit() {

    console.log('Heartrate Component');
    var that = this;

    this.initSvg();
    this.initHeartBeatGraph();

    for (var j = 0; j < this.lineCount; j++) {
      for (var i = 0; i < this.count; i++) {
        var myg = d3.selectAll("svg").filter("[data-idx='" + i + "']").select("g");
        var myData = this.data[j][i];
        var it = myg.append("g")
          .attr("clip-path", "url(#clip)")
          .append("path")
          .datum(myData)
          .attr("class", "line " + this.colors[j] + "-line")
          .attr("data-color-idx", j)
          .transition()
          .duration(1000 / this.ticksPerSecond)
          .ease(d => d3.easeLinear(d))
          .on("start", function() {
            var d3Element = this;
            that.tick(that, d3Element);
          });
        this.hold.push(it); // save so I can remove handler later
      }
    }
  }

  tick(that, d3Element) {

    console.log("tick");
    var selectedActive = d3.active(d3Element);
    if (selectedActive == null) {
      console.log("not active");
      return;
    }

    var selectedg = d3.select(d3Element);
    var idk = selectedg._groups[0][0];
    var idx = parseInt(d3.select(idk.parentNode).node().parentNode.parentNode.getAttribute("data-idx"));
    var colorIdx = parseInt(selectedg.attr("data-color-idx"));

    var myData = that.data[colorIdx][idx];
    if (myData === undefined) return;

    var newData = that.random();
    myData.push(newData);

    that.updateBpm(newData, colorIdx);

    selectedg.attr("d", that.line).attr("transform", null);
    selectedActive.attr("transform", "translate(" + that.x(that.dateTimeNow.toDate()) + ",0)")
      .transition().on("start", function() {
        var d3Element = this;
        that.tick(that, d3Element);
      });

    if (!myData.includes(that.defaultDataValue)) {
        that.updateTimeScale(colorIdx);
    }
   
    myData.shift();
  }

  updateBpm(dataPoint, colorIndex) {
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


  updateTimeScale(colorIndex) {

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

      this.dateTimeNow.add(1, 'minutes');
      this.dateTimeFifteenMins = this.dateTimeNow.clone().startOf('minute').add(15, 'minutes');
      this.x = d3.scaleTime().domain([this.dateTimeNow.toDate(), this.dateTimeFifteenMins.toDate()]).range([0, this.width]);
      this.redrawTimeScale();
    }
  }

  redrawTimeScale() {
    this.g.selectAll(".axis--x").data([]).exit().remove();

    // Re-Draw X Axes
    this.drawXAxes();
  }
}
