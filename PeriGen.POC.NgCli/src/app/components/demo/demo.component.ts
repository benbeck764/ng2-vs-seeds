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

  handleEvent(event: ChannelEvent) {
    let date = new Date();
    if (event && event.Data && event.Data !== "") {
      //console.log(JSON.stringify(event.Data.toString()));
      this.jsonMatches = `${date.toLocaleTimeString()} : ${JSON.stringify(event.Data)}\n` + this.jsonMatches;
      this.updateD3Svg(JSON.parse(event.Json));
    }
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

    // Call API to trigger SignalR to send Match data via _channelService SignalR 
    this._matchesService.getLatestMatches().subscribe();
  }

  initD3Svg() {
    if (this.parentNativeElement !== null) {

      var diameter = 960;
      this.center = { x: diameter / 2, y: diameter / 2 };

      this.svg = d3.select("#heroes-chart").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

      var charge = d => -Math.pow(d.radius, 2.0) * 0.03;

      this.simulation = d3.forceSimulation(/*this.nodes*/)
        .velocityDecay(0.2)
        .force('charge', d3.forceManyBody().strength(charge))
        .force('x', d3.forceX().strength(this.forceStrength).x(this.center.x))
        .force('y', d3.forceY().strength(this.forceStrength).y(this.center.y))
        .alphaTarget(1)
        //.force("center", d3.forceCenter())
        .on('tick', this.ticked);

      this.bubbles = this.svg.selectAll('.bubble')
        .data(this.nodes, d => d.id);
    }
  }

  updateD3Svg(matches: Match[]) {
    // Update current counts of each hero
    matches.forEach(match => {
      match.players.forEach(player => {
        if (!this.heroCounts.has(player.hero_id)) {
          this.heroCounts.set(player.hero_id, 1);
        } else {
          var currentCount = this.heroCounts.get(player.hero_id);
          currentCount++;
          this.heroCounts.set(player.hero_id, currentCount);
        }
      });
    });

    // Update the SVG itself (push new nodes)
    this.updateNodes();
  }

  updateNodes() {

    var updatedList = [];
    var maxAmount = this.getMaxHeroCount();

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

    // Create updated nodes and push to updatedList
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

    // Set nodes from updatedList
    updatedList.sort((a, b) => b.value - a.value);
    this.nodes = updatedList;

    if (this.nodes.length > 0) {
      // Apply the general update pattern to the nodes.
      this.bubbles = this.bubbles.data(this.nodes, d => d.id);
      this.bubbles.exit().remove();
      this.bubbles = this.bubbles.enter().append("circle")
        .attr("fill", d => 'red')
        .attr("r", 0).merge(this.bubbles)
        .attr("transform",
          d => "translate(" + d.x + "," + d.y + ")");

      this.bubbles.transition()
        .duration(2000)
        .attr('r', d => d.radius);

      // Update and restart the simulation.
      this.simulation.nodes(this.nodes);
      this.groupBubbles();
    }
  };

  charge(d) {
    return -Math.pow(d.radius, 2.0) * this.forceStrength;
  };

  showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = 'Hello I am some content';  

    // TODO
    //this.tooltip.showTooltip(content, d3.event);
  }

  hideDetail(d) {
    // reset outline
    d3.select(this).attr('stroke', d3.rgb(this.fillColor(d.group)).darker());

    // TODO
    //this.tooltip.hideTooltip();
  }

  ticked() {
   if (this.bubbles != null) {
     this.bubbles
       .attr('cx', d => d.x)
       .attr('cy', d => d.y);
   }
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
      //this.simulation.nodes(this.nodes).on('tick', this.ticked);
      //this.simulation.force('center', d3.forceCenter(this.center.x, this.center.y));

      // @v4 We can reset the alpha value and restart the simulation
      this.simulation.alpha(1).restart();
    }
  }
}

