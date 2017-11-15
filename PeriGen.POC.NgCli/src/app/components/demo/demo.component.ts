import { Component, OnInit, ElementRef } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { ChannelService, ConnectionState, ChannelEvent } from "../../services/channel.service";
import { MatchesService, Match, HeroesDictionary } from "../../services/matches.service";
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
  private logs: string = "";
  private heroesDictionary = new HeroesDictionary();
  private simulationStart = null;
  private simulation = null;
  private diameter = 960;
  private center: any = { x: 0, y: 0 };
  private first: boolean = true;

  private heroCounts = new Map<number, number>();
  private matchIds = [];
  private color = d3.interpolateHcl("#0faac3", "#dd2323");

  //These will be set in initD3Svg() & updateD3Svg() & updateNodes()
  private svg = null;
  private bubbles = null;
  private nodes = [];
  private root = null;
  private bubble = null;

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
    if (event && event.Data && event.Data !== "") {
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

      // Configure center of the SVG
      this.center = { x: this.diameter / 2, y: this.diameter / 2 };

      // Configure the Force Layout
      var forceCollide = d3.forceCollide()
        .strength(.8)
        .radius(d => d.radius)
        .iterations(10);

      // Configure the Force Layout Simulation
      this.simulation = d3.forceSimulation()
        .force("forceX", d3.forceX(this.center.x).strength(.0005))
        .force("forceY", d3.forceY(this.center.y).strength(.0025))
        .force('collide', forceCollide)
        .on('tick', this.ticked.bind(this));

      this.simulationStart = d3.forceSimulation()
        .force("forceX", d3.forceX(this.center.x).strength(.04))
        .force("forceY", d3.forceY(this.center.y).strength(.2))
        .force('collide', forceCollide)
        .on('tick', this.ticked.bind(this));

    
      this.svg = d3.select("#heroes-chart").append("svg")
        //.attr("width", this.diameter)
        //.attr("height", this.diameter)
        .attr("width", '100%')
        .attr("height", '100%')
        .attr('viewBox', '0 0 ' + Math.min(this.diameter, this.diameter) + ' ' + Math.min(this.diameter, this.diameter))
        .attr('preserveAspectRatio', 'xMinYMin')
        .attr("class", "bubble");

      this.bubble = d3.pack()
        .size([this.diameter - 25, this.diameter - 25])
        .padding(5);

      this.bubbles = this.svg.selectAll('g.bubble');
    }
  }

  updateD3Svg(matches: Match[]) {
    this.updateNodes(matches);
  }

  updateNodes(matches: Match[]) {

    var updatedList = [];
   
    // Update current counts of each hero
    matches.forEach(match => {
      if (this.matchIds.indexOf(match.match_id) === -1) {
        this.matchIds.push(match.match_id);

        match.players.forEach(player => {
          // TODO -- Remove?
          if (player.account_id === 111871881 && player.hero_id !== 0) {
            if (!this.heroCounts.has(player.hero_id)) {
              this.heroCounts.set(player.hero_id, 1);
            } else {
              var currentCount = this.heroCounts.get(player.hero_id);
              currentCount++;
              this.heroCounts.set(player.hero_id, currentCount);
            }

            // TODO Logging
            let date = new Date();
            this.logs = `${date.toLocaleTimeString()} : ${this.heroesDictionary.getHeroName(player.hero_id)}\n` + this.logs;
          }
        });
      }
    });

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
      var radius = radiusScale(+heroCount);
      updatedList.push({
        id: key,
        radius: radius,
        count: +heroCount,
        heroName: this.heroesDictionary.getHeroName(key),
        heroId: key,
        x: this.center.x,
        y: this.center.y
      });
    });

    this.root = d3.hierarchy(updatedList)
      .sum(d => d.count)
      .sort((a, b) => b.count - a.count);

    var leaves = this.bubble(this.root);
    //console.log(JSON.stringify(leaves));

    //this.root = d3.hierarchy(this.nodes)
    //  .sum(d => d.value)
    //  .sort((a, b) => b.radius - a.radius);

    var addNewNodes = false;
    if (updatedList.length > this.nodes.length) {
      addNewNodes = true;
    }

    for (var i = 0; i < leaves.data.length; i++) {
      if (this.nodes[i] && this.nodes[i].id === leaves.data[i].id) {
        var oldR = this.nodes[i].newR;
        this.nodes[i].oldR = oldR;
        this.nodes[i].newR = leaves.data[i].r;
      }
      else {
        this.nodes[i] = leaves.data[i];
        this.nodes[i].oldR = 1;
        this.nodes[i].newR = leaves.data[i].r;
      }
    }

    if (this.first || addNewNodes) {
      this.first = false;

      this.bubbles.exit().remove();
      this.bubbles = this.bubbles.data(this.nodes, d => d.id);
      this.bubbles.exit().remove();
      this.bubbles = this.bubbles.enter()
        .append('g')
        .attr('class', 'bubble');

      this.bubbles.append("circle")
        .attr('fill', d => 'red')
        .attr('r', 0);

      //.attr("transform",
      //  d => "translate(" + d.x + "," + d.y + ")");

      this.bubbles.append("text")
        .attr("dy", "0.3em")
        .style('fill', 'black')
        .style("text-anchor", "middle")
        .style('font-size', d => d.r / 4 + "px")
        .text(d => d.heroName);

      var that1 = this;
      // Tansition in size (radius)
      this.bubbles.transition()
        .ease(d3.easePolyInOut)
        .duration(950)
        .tween('radius', function (d) {
          var selection = d3.select(this);
          var i = d3.interpolate(1, d.newR);
          return t => {
            d.r = i(t);
            selection.attr('r', d => d.radius);
            that1.simulationStart.nodes(that1.nodes).alpha(1);
          }
        });

    } else {
      var that2 = this;
      // Tansition in size (radius)
      this.bubbles.transition()
        .ease(d3.easePolyInOut)
        .duration(950)
        .tween('radius', function (d) {
          var selection = d3.select(this);
          var i = d3.interpolate(1, d.newR);
          return t => {
            d.r = i(t);
            selection.attr('r', d => d.radius);
            that2.simulation.nodes(that2.nodes).alpha(1);
          }
        });

      //
      //this.bubbles.select('text')
      //  .transition()
      //  .ease(d3.easePolyInOut)
      //  .duration(950)
      //  .style('font-size', d => d.radius / 4 + "px");
    }
  };

  ticked() {
    if (this.bubbles) {
      this.bubbles
        .attr('transform', d => "translate(" + d.x + "," + d.y + ")")
        .select('circle')
        .attr('r', d => d.radius);
    }
  }

  getMaxHeroCount() {
    let max = 0;
    const values = Array.from(this.heroCounts.values());
    max = Math.max.apply(this, values);
    return max;
  }
}

