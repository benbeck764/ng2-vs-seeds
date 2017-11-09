import { Component, OnInit, ElementRef} from '@angular/core';
import * as d3 from "d3";

export class TestData {
  id: string;
  value: number;
  ns: string;
}

@Component({
  selector: 'pg-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit {

  private parentNativeElement: any;

  constructor(element: ElementRef) { 
    this.parentNativeElement = element.nativeElement;
  }

  // Returns a flattened hierarchy containing all leaf nodes under the root.
  public classes(root) {
    var classes = [];

    function recurse(name, node) {
      if (node.children) node.children.forEach(function (child) { recurse(node.name, child); });
      else classes.push({ packageName: name, className: node.name, value: node.size });
    }

    recurse(null, root);
    return { children: classes };
  }

  ngOnInit() {
    let width: number;
    let height: number;

    if (this.parentNativeElement !== null) {

      var diameter = 960;
      var format = d3.format(",d");
      var color = d3.scaleOrdinal(d3.schemeCategory20c);

      var bubble = d3.pack()
        .size([diameter, diameter])
        .padding(1.5);

      var svg = d3.select("#bubble-chart").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

      d3.json("assets/flare.json",
        (error, data) => {
          if (error) throw error;

          var root = d3.hierarchy(this.classes(data))
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

          bubble(root);

          var node = svg.selectAll(".node")
            .data(root.children)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

          node.append("title")
            .text(d => d.data.className + ": " + format(d.value));

          node.append("circle")
            .attr("r", d => d.r)
            .style("fill",
              d => color(d.data.packageName));

          node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(d => d.data.className.substring(0, d.r / 3));
        });

        d3.select(self.frameElement).style("height", diameter + "px");
    }
  }
}
