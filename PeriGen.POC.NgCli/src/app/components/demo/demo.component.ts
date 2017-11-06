import { Component, OnInit, ElementRef } from '@angular/core';
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { ChannelService, ConnectionState, ChannelEvent } from "../../services/channel.service";
import { MatchesService, Match, Player } from "../../services/matches.service";
import * as d3 from 'd3';

@Component({
  selector: 'pg-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  private parentNativeElement: any;
  connectionState$: Observable<string>;
  private channel: string = "TestChannel";
  private eventName: string = "Dota2MatchDetails";
  private jsonMatches: string = "";
  private forceStrength = 0.03;
  private simulation = null;
  private center: any = {x: 0, y: 0};
  //private tooltip = floatingTooltip('gates_tooltip', 240);
  private fillColor = d3.scaleOrdinal()
    .domain(['low', 'medium', 'high'])
    .range(['#d84b2a', '#beccae', '#7aa25c']);

  private heroCounts = new Map<number, number>();

  //These will be set in create_nodes and create_vis
  private svg = null;
  private bubbles = null;
  private nodes = [];

  constructor(private _element: ElementRef, private _channelService: ChannelService, private _matchesService: MatchesService) {
    this.parentNativeElement = _element.nativeElement;
    this.connectionState$ = this._channelService.connectionState$
      .map((state: ConnectionState) => { return ConnectionState[state]; });

    this._channelService.error$.subscribe(
      (error: any) => { console.warn(error); },
      (error: any) => { console.error("errors$ error", error); }
    );

    this._channelService.starting$.subscribe(
      () => { console.log("signalr service has been started"); },
      () => { console.warn("signalr service failed to start!"); }
    );
  }

  ngOnInit() {
    // Init D3 Svg
    this.initD3Svg();

    // Start the SignalR connection
    this._channelService.start();

    this._channelService.sub(this.channel).subscribe(
      (x: ChannelEvent) => {
        switch (x.Name) {
          case this.eventName: { this.handleEvent(x); }
        }
      },
      (error: any) => {
        console.warn("Attempt to join channel failed!", error);
      }
    );

    this._matchesService.getLatestMatches()
      .subscribe((matches: Match[]) => { matches.forEach(match => {
        //console.log(match);
      });
    });
  }

  handleEvent(event: ChannelEvent) {
    let date = new Date();
    if (event && event.Data && event.Data !== "") {
      //console.log(JSON.stringify(event.Data.toString()));
      this.jsonMatches = `${date.toLocaleTimeString()} : ${JSON.stringify(event.Data)}\n` + this.jsonMatches;
      this.updateD3Svg(JSON.parse(event.Json));
    }   
  }

  initD3Svg() {
    if (this.parentNativeElement !== null) {

      var diameter = 960;
      this.center = { x: diameter / 2, y: diameter / 2 };
      var format = d3.format(",d");
      var color = d3.scaleOrdinal(d3.schemeCategory20c);

      var bubble = d3.pack()
        .size([diameter, diameter])
        .padding(1.5);

      // Here we create a force layout and
      // @v4 We create a force simulation now and
      //  add forces to it.
      this.simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(this.forceStrength).x(this.center.x))
        .force('y', d3.forceY().strength(this.forceStrength).y(this.center.y))
        .force('charge', d3.forceManyBody().strength(this.charge).bind(this.forceStrength))
        .on('tick', this.ticked);

      // @v4 Force starts up automatically,
      //  which we don't want as there aren't any nodes yet.
      this.simulation.stop();

      this.svg = d3.select("#heroes-chart").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");
    }
  }

  updateD3Svg(match: Match) {
    // Update current counts of each hero
    match.players.forEach(player => {
      if (!this.heroCounts.has(player.heroId)) {
        this.heroCounts.set(player.heroId, 1);
      } else {
        var currentCount = this.heroCounts.get(player.heroId);
        currentCount++;
        this.heroCounts.set(player.heroId, currentCount);
      }
    });

    // Update the SVG itself (push new nodes)
    this.updateNodes(match);
  }

  updateNodes(match: Match) {

    this.nodes = [];
    var updatedList = [];
    var maxAmount = this.getMaxHeroCount();

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

    let keys = Array.from(this.heroCounts.keys());
    keys.forEach(key => {
      var heroCount = this.heroCounts.get(key);
      updatedList.push({
        id: key,
        radius: radiusScale(+heroCount),
        count: +heroCount,
        //name: d.grant_title, //TODO -- Grab Hero Name
        heroId: key,
        x: Math.random() * 900,
        y: Math.random() * 800
      });
    });

    this.nodes = updatedList;

    if (this.nodes.length > 0) {

      // Bind nodes data to what will become DOM elements to represent them.
      this.bubbles = this.svg.selectAll('.bubble')
        .data(this.nodes, function (d) { return d.id; });

      // Create new circle elements each with class `bubble`.
      // There will be one circle.bubble for each object in the nodes array.
      // Initially, their radius (r attribute) will be 0.
      // @v4 Selections are immutable, so lets capture the
      //  enter selection to apply our transtition to below.
      var bubblesE = this.bubbles.enter().append('circle')
        .classed('bubble', true)
        .attr('r', 0)
        .attr('fill', d => { return this.fillColor(d.group); })
        .attr('stroke', d => { return d3.rgb(this.fillColor(d.group)).darker(); })
        .attr('stroke-width', 2)
        .on('mouseover', this.showDetail)
        .on('mouseout', this.hideDetail);

      // @v4 Merge the original empty selection and the enter selection
      this.bubbles = this.bubbles.merge(bubblesE);

      // Fancy transition to make bubbles appear, ending with the correct radius
      this.bubbles.transition()
        .duration(2000)
        .attr('r', function (d) { return d.radius; });

      this.simulation.nodes(this.nodes);
      //this.groupBubbles();
    }
  };

  charge(d) {
    return -Math.pow(d.radius, 2.0) * this.forceStrength;
  };

  //createNodes(rawData) {

  //  var maxAmount = this.getMaxHeroCount();

  //  // Sizes bubbles based on area.
  //  // @v4: new flattened scale names.
  //  var radiusScale = d3.scalePow()
  //    .exponent(0.5)
  //    .range([2, 85])
  //    .domain([0, maxAmount]);

  //  // Use map() to convert raw data into node data.
  //  // Checkout http://learnjsdata.com/ for more on
  //  // working with data.
  //  var myNodes = rawData.map(function (d) {
  //    var heroId = d.heroId;
  //    var heroCount = this.heroCounts.get(heroId);
  //    return {
  //      id: heroId,
  //      radius: radiusScale(+heroCount),
  //      count: +heroCount,
  //      //name: d.grant_title, //TODO -- Grab Hero Name
  //      heroId: heroId,
  //      x: Math.random() * 900,
  //      y: Math.random() * 800
  //    };
  //  });

  //  // sort them to prevent occlusion of smaller nodes.
  //  myNodes.sort(function (a, b) { return b.value - a.value; });

  //  return myNodes;
  //}

  showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = 'Hello I am some content';

    // TODO
    //this.tooltip.showTooltip(content, d3.event);
  }

  hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(this.fillColor(d.group)).darker());

    // TODO
    //this.tooltip.hideTooltip();
  }

  ticked() {
    //if (this.nodes.length > 0) {
    //  this.bubbles
    //    .attr('cx', function (d) { return d.x; })
    //    .attr('cy', function (d) { return d.y; });
    //}  
  }

  getMaxHeroCount() {
    var max = 0;
    let values = Array.from(this.heroCounts.values());
    max = Math.max.apply(this, values);
    return max;
  }

  groupBubbles() {
    if (this.nodes.length > 0 && this.bubbles != null) {
      // @v4 Reset the 'x' force to draw the bubbles to the center.
      this.simulation.force('x', d3.forceX().strength(this.forceStrength).x(this.center.x));

      // @v4 We can reset the alpha value and restart the simulation
      this.simulation.alpha(1).restart();
    }
  }
}
