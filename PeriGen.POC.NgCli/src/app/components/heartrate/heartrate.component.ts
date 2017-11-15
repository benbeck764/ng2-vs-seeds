import { Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'pg-heartrate',
  templateUrl: './heartrate.component.html',
  styleUrls: ['./heartrate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeartrateComponent implements OnInit {

  private parentNativeElement: any;
  private data;
  private random = d3.randomUniform(120, 190);
  private n = 15;
  private count = 30;
  private lineCount = 4;
  private colors = ["purple", "blue", "green", "red"];

  private yMin = 30;
  private yMax = 240;
  private svgWidth = 1650;
  private svgHeight = 300;
  private margin = { top: 20, right: 20, bottom: 20, left: 30 };
  private width = this.svgWidth - this.margin.left - this.margin.right;
  private height = this.svgHeight - this.margin.top - this.margin.bottom;
  private x = d3.scaleLinear().domain([0, this.n]).range([0, this.width]);
  private y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);

  private yMajorTickScale = d3.scaleLinear().domain([0, 240]).range([this.height, 0]);

  private matrix = Array.apply(null, { length: this.count }).map(Number.call, Number);

  private line = d3.line()
    .curve(d3.curveBasis)
    .x((d, i) => this.x(i))
    .y((d, i) => this.y(d));

  private params = {
    lineCount: 4,
    graphCount: 1,
    width: 1650,
    height: 300
  };

  private hold = [];

  private baby1bpm;
  private baby2bpm;
  private baby3bpm;
  private baby4bpm;

  private that = this;

  constructor(private _element: ElementRef) {
    this.parentNativeElement = _element.nativeElement;
  }

  ngOnInit() {

    var that = this;

    console.log('Heartrate Component');
    this.lineCount = this.params.lineCount;
    this.count = this.params.graphCount;
    this.svgWidth = this.params.width;
    this.svgHeight = this.params.height;

    // remove event handler
    for (var i = 0; i < this.hold.length; i++) {
      var path = this.hold[i]._groups[0][0];
      path.__transition = null;
    }

    this.data = new Array(this.lineCount);
    for (var j = 0; j < this.lineCount; j++) {
      this.data[j] = new Array(this.count);
      for (var i = 0; i < this.count; i++) {
        this.data[j][i] = d3.range(this.n).map(d => 0);
      }
    }

    d3.selectAll("svg").data([]).exit().remove();

    this.matrix = Array.apply(null, { length: this.count }).map(Number.call, Number);

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

    var myWidth = d3.selectAll("svg").style("width").replace("px", "");
    var myHeight = d3.selectAll("svg").style("height").replace("px", "");

    d3.selectAll("svg")
      .attr('viewBox', '0 0 ' + myWidth + ' ' + myHeight)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .classed("svg-content-responsive", true);
      
    var g = svg.append("g")
      .attr("width", "100%")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.width = myWidth - this.margin.left - this.margin.right;
    this.height = myHeight - this.margin.top - this.margin.bottom;
    this.x = d3.scaleLinear().domain([0, this.n]).range([0, this.width]);
    this.y = d3.scaleLinear().domain([this.yMin, this.yMax]).range([this.height, 0]);
   
    this.line = d3.line()
      .curve(d3.curveBasis)
      .x((d, i) => this.x(i))
      .y((d, i) => this.y(d));

    // create area
    g.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", "100%")
      .attr("height", this.height);

    // add shaded area between 120/180 bpm
    g.append("g")
      .append("rect")
      .attr("x", this.x(0))
      .attr("y", this.y(180))
      .attr("width", this.width)
      .attr("height", this.y(120) - this.y(180))
      .attr("fill", "#f6f6f6");


    // add x axis
    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.y(this.yMin) + ")")
      .call(d3.axisBottom(this.x));


    // add x axis gridlines - vertical
    g.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .tickValues(Array.from(Array(90).keys()).map(n => n / 6))
        .tickSize(-(this.height), 1, 1)
        .tickFormat("")
    );

    // add thick (major) x axis gridlines - vertical
    g.append("g")
      .attr("class", "grid-thick")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x)
        .tickValues(Array.from(Array(15).keys()).concat([15]))
        .tickSize(-(this.height), 1, 1)
        .tickFormat("")
    );

    // add y axis
    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(this.y).tickValues([30, 60, 90, 120, 150, 180, 210, 240]));

    // add y axis gridlines - horizontal
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(this.y)
        .ticks(24)
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    // add thick y axis gridlines - horizontal
    g.append("g")
      .attr("class", "grid-thick")
      .call(d3.axisLeft(this.y)
        .tickValues([30, 60, 120, 180, 240])
        .tickSize(-(this.width), 1, 1)
        .tickFormat("")
    );

    for (var j = 0; j < this.lineCount; j++) {

      for (i = 0; i < this.count; i++) {
        var myg = d3.selectAll("svg").filter("[data-idx='" + i + "']").select("g");
        var myData = this.data[j][i];
        var it = myg.append("g")
          .attr("clip-path", "url(#clip)")
          .append("path")
          .datum(myData)
          .attr("class", "line " + this.colors[j] + "-line")
          .attr("data-color-idx", j)
          .transition()
          .duration(500)
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
    selectedActive.attr("transform", "translate(" + that.x(0) + ",0)")
      .transition().on("start", function() {
        var d3Element = this;
        that.tick(that, d3Element);
      });

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

}
