import { Main } from '@services/main/main';
import { MainService } from '@services/main/main.service';
import { Ramp } from '@services/fds-object/ramp/ramp';
import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation } from '@angular/core';

import * as d3Selection from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

import { saveAs } from 'file-saver';
import { forEach, sortBy, round, find, toNumber } from 'lodash';
import { LibraryService } from '@services/library/library.service';
import { Library } from '@services/library/library';

@Component({
  selector: 'ramp-chart',
  templateUrl: './ramp-chart.component.html',
  styleUrls: ['./ramp-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RampChartComponent implements OnInit, OnChanges {

  @ViewChild('rampChart') private chartContainer: ElementRef;
  @Input() private rampId: string;
  @Input() private xLabel: string;
  @Input() private yLabel: string;
  @Input() private units: string[];
  @Input() private value: any;
  @Input() private objectType: string;
  @Input() private update: Function;

  public main: Main;
  public lib: Library;
  public ramps: Ramp[];
  public libRamps: Ramp[];
  public ramp: Ramp;

  mainSub;
  libSub;

  public dotsNth: number;
  private margin = { top: 10, right: 20, bottom: 50, left: 70 };
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private xAxis: any;
  private yAxis: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;

  constructor(private mainService: MainService, private libraryService: LibraryService) { }

  ngOnInit() {
    this.mainSub = this.mainService.getMain().subscribe(main => this.main = main);
    this.libSub = this.libraryService.getLibrary().subscribe(lib => this.lib = lib);

    this.ramps = this.main.currentFdsScenario.fdsObject.ramps.ramps;
    this.libRamps = this.lib.ramps;

    this.dotsNth = 1;

    if (!this.svg) {
      this.createChart();
      this.updateChart();
    }

  }

  ngOnChanges() {
    if (this.svg) {
      this.updateChart();
    }
  }

  ngOnDestroy() {
    this.mainSub.unsubscribe();
    this.libSub.unsubscribe();
  }

  /** Set time value */
  private setT(tValue: number, stepIndex: number) {
    this.ramp.steps[stepIndex].t = toNumber(tValue);
  }

  /** Get ramp f value without calc */
  private getPureF(stepIndex: number) {
    return this.ramp.steps[stepIndex].f;
  }

  /** Set ramp f value without calc */
  private setPureF(fValue: number, stepIndex: number) {
    this.ramp.steps[stepIndex].f = fValue;
  }

  /** Get ramp f value */
  private getF(stepIndex: number) {
    return round(this.ramp.steps[stepIndex].f * this.value, 6);
  }

  /** Set ramp f value */
  private setF(fValue: number, stepIndex: number) {
    this.ramp.steps[stepIndex].f = fValue / this.value;
  }

  /** Prepare data befor ploting */
  private prepareData(): any[] {
    // Find ramp using id (rampId)
    if (this.objectType == 'current') {
      this.ramp = find(this.ramps, (ramp) => {
        return ramp.id == this.rampId;
      });
    }
    else if (this.objectType == 'library') {
      this.ramp = find(this.libRamps, (ramp) => {
        return ramp.id == this.rampId;
      });
    }

    // Sort ramp steps
    this.ramp.steps = sortBy(this.ramp.steps, ['t']);

    // Value times F
    let value = 1.0;
    if (this.value) {
      value = this.value
    }
    //Prepare data steps
    let steps = []
    forEach(this.ramp.steps, data => {
      steps.push([data['t'], data['f'] * value]);
    });

    // Sort data
    steps = sortBy(steps, (step) => {
      return step[0];
    });

    return steps;
  }

  /** Create chart */
  private createChart() {
    // Init chart
    const element = this.chartContainer.nativeElement;

    // Width & height is canvas element minus margins
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.svg = d3Selection.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // Init axis
    this.x = d3Scale.scaleLinear()
      .range([0, this.width]);

    this.y = d3Scale.scaleLinear()
      .range([this.height, 0]);

    this.xAxis = d3Axis.axisBottom(this.x);
    this.yAxis = d3Axis.axisLeft(this.y);

    // Prepare line
    this.line = d3Shape.line()
      .x((d: any) => this.x(d[0]))
      .y((d: any) => this.y(d[1]))
      .curve(d3Shape.curveLinear);
  }

  /** Update chart */
  public updateChart() {

    // Remove previous plot and axis
    this.svg.selectAll('.line').remove();
    this.svg.selectAll('.axis').remove();
    this.svg.selectAll('g').remove();

    // Prepare data
    let steps = this.prepareData();

    // Prepare points
    let points = [];
    forEach(steps, function (step) {
      points.push({ x: step[0], y: step[1] });
    });

    points = points.filter((point, index) => {
      return index % toNumber(this.dotsNth) == 0;
    });

    // Init axis
    this.x = d3Scale.scaleLinear()
      .domain(d3Array.extent(steps, (d) => d[0]))
      .range([0, this.width + 10]);
    this.y = d3Scale.scaleLinear()
      .domain(d3Array.extent(steps, (d) => d[1]))
      .range([this.height, 10]);

    // Draw axis
    this.svg.append("g")
      .attr("class", "axis axis-x")
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3Axis.axisBottom(this.x));
    this.svg.append("g")
      .attr("class", "axis axis-y")
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3Axis.axisLeft(this.y));

    // Drawy x axis label
    this.svg.append("text")
      .attr("class", "x label")
      .attr("fill", "rgb(250,250,250)")
      .attr("text-anchor", "middle")
      .attr("x", (this.width + this.margin.left + this.margin.right) / 2)
      .attr("y", this.height + this.margin.top + this.margin.bottom - 5)
      .text(this.xLabel +' ['+ this.units[0] +']');

    // Drawy y axis label
    this.svg.append("text")
      .attr("class", "y label")
      .attr("fill", "rgb(250,250,250)")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", (this.height + this.margin.top + this.margin.bottom) / -2)
      .attr("y", 15)
      .text(this.yLabel+' ['+ this.units[1] +']');

    // Draw line
    this.svg.append("path")
      .datum(steps)
      .attr("class", "line")
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .attr("d", this.line)
      .attr('stroke-width', 6)
      .attr('stroke', 'rgb(120,120,145)')
      .attr('fill', 'none');

    // Draw dots
    let gdots = this.svg.selectAll("g.dot")
      .data(points)
      .enter().append('g');

    gdots.append("circle")
      .attr("class", "dot")
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .attr("r", 6)
      .attr("fill", "rgb(0,168,243)")
      .attr("cx", (d) => { return this.x(d.x); })
      .attr("cy", (d) => { return this.y(d.y); });

    // Draw dots label
    gdots.append("text")
      .text((d) => { return round(d.y, 2); })
      .attr('transform', `translate(${this.margin.left - 10}, ${this.margin.top - 10})`)
      .attr("x", (d) => { return this.x(d.x); })
      .attr("y", (d) => { return this.y(d.y); });
  }

  /**
   * Save ramp chart
   */
  public saveChart() {
    // Create svg string
    var svgString = this.getSVGString(this.svg.node());
    // Export string and save image
    this.svgString2Image(svgString, 2 * this.width, 2 * this.height, 'png'); 
  }

  /**
   * Generate svn string
   * @param svgNode 
   */
  private getSVGString(svgNode: any) {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    let cssStyleText = "text { fill: #000; font-size: 10pt;}";

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    // Add custom style
    svgString = svgString.replace('xlink">', 'xlink"><style xmlns="http://www.w3.org/1999/xhtml" type="text/css">'+ cssStyleText +'</style>');
    // Fix root xlink without namespace
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); 
    // Safari NS namespace fix
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); 

    return svgString;
  }


  /**
   * Convert svg to image
   * @param svgString 
   * @param width 
   * @param height 
   * @param format 
   */
  public svgString2Image(svgString: string, width: number, height: number, format: string) {
    var format = format ? format : 'png';

    // Convert SVG string to data URL
    var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); 

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        saveAs(blob, this.xLabel +'-'+ this.yLabel +'-ramp.png'); 
      });
    };

    image.src = imgsrc;
  }

}
