import { ChartwerkBase, VueChartwerkBaseMixin, TickOrientation, TimeFormat } from '@chartwerk/base';
import { LineTimeSerie, LineOptions, Mode } from './types';

import * as d3 from 'd3';
import * as _ from 'lodash';


export class ChartwerkLineChart extends ChartwerkBase<LineTimeSerie, LineOptions> {
  constructor(el: HTMLElement, _series: LineTimeSerie[] = [], _options: LineOptions = {}) {
    super(d3, el, _series, _options);
  }

  _renderMetrics(): void {
    // TODO: seems that renderMetrics is not correct name 
    if(this._series.length === 0) {
      this._renderNoDataPointsMessage();
      return;
    }
    this.updateCrosshair();

    for(let idx = 0; idx < this._series.length; ++idx) {
      if(this._series[idx].visible === false) {
        continue;
      }
      const confidence = this._series[idx].confidence || 0;
      const mode = this._series[idx].mode || Mode.STANDARD;
      const target = this._series[idx].target;
      this._renderMetric(
        this._series[idx].datapoints,
        { color: this.getSerieColor(idx), confidence, target, mode }
      );
    }
  }

  _renderMetric(
    datapoints: number[][],
    metricOptions: {
      color: string,
      confidence: number,
      target: string,
      mode: Mode
    }
  ): void {
    if(_.includes(this.seriesTargetsWithBounds, metricOptions.target)) {
      return;
    }

    if(metricOptions.mode === Mode.CHARGE) {
      const dataPairs = this._d3.pairs(datapoints);
      this._chartContainer.selectAll(null)
        .data(dataPairs)
        .enter()
        .append('line')
        .attr('x1', d => this.xScale(d[0][1]))
        .attr('x2', d => this.xScale(d[1][1]))
        .attr('y1', d => this.yScale(d[0][0]))
        .attr('y2', d => this.yScale(d[1][0]))
        .attr('stroke-opacity', 0.7)
        .style('stroke-width', 1)
        .style('stroke', d => {
          if(d[1][0] > d[0][0]) {
            return 'green';
          } else if (d[1][0] < d[0][0]) {
            return 'red';
          } else {
            return 'gray';
          }
        });
      return;
    }

    const lineGenerator = this._d3.line()
      .x((d: [number, number]) => this.xScale(d[1]))
      .y((d: [number, number]) => this.yScale(d[0]));

    this._chartContainer
      .append('path')
      .datum(datapoints)
      .attr('class', 'metric-path')
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', 'none')
      .attr('stroke', metricOptions.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.7)
      .attr('d', lineGenerator);

    let upperBoundDatapoints = [];
    let lowerBoundDatapoints = [];
    if(
      this._options.bounds !== undefined &&
      this._options.bounds.upper !== undefined &&
      this._options.bounds.lower !== undefined
    ) {
      this._series.forEach(serie => {
        if(serie.target === this.formatedBound(this._options.bounds.upper, metricOptions.target)) {
          upperBoundDatapoints = serie.datapoints;
        }
        if(serie.target === this.formatedBound(this._options.bounds.lower, metricOptions.target)) {
          lowerBoundDatapoints = serie.datapoints;
        }
      });
    }

    if(upperBoundDatapoints.length > 0 && lowerBoundDatapoints.length > 0) {
      const zip = (arr1, arr2) => arr1.map((k, i) => [k[0],k[1], arr2[i][0]]);
      const data = zip(upperBoundDatapoints, lowerBoundDatapoints);

      this._chartContainer.append('path')
        .datum(data)
        .attr('fill', metricOptions.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this._d3.area()
          .x((d: number[]) => this.xScale(d[1]))
          .y0((d: number[]) => this.yScale(d[0]))
          .y1((d: number[]) => this.yScale(d[2]))
        )
    }

    if(metricOptions.confidence > 0) {
      this._chartContainer.append('path')
        .datum(datapoints)
        .attr('fill', metricOptions.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this._d3.area()
          .x((d: [number, number]) => this.xScale(d[1]))
          .y0((d: [number, number]) => this.yScale(d[0] + metricOptions.confidence))
          .y1((d: [number, number]) => this.yScale(d[0] - metricOptions.confidence))
        )
    }
  }

  updateCrosshair(): void {
    // Base don't know anything about crosshair circles, It is only for line pod
    this.appendCrosshairCircles();
  }

  appendCrosshairCircles(): void {
    // circle for each serie
    this._series.forEach((serie: LineTimeSerie, serieIdx: number) => {
      this.appendCrosshairCircle(serieIdx);
    });
  }

  appendCrosshairCircle(serieIdx: number): void {
    this._crosshair.append('circle')
      .attr('class', `crosshair-circle-${serieIdx} crosshair-background`)
      .attr('r', 9)
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', this.getSerieColor(serieIdx))
      .style('opacity', 0.3)
      .style('pointer-events', 'none');
    
    this._crosshair
      .append('circle')
      .attr('class', `crosshair-circle-${serieIdx}`)
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', this.getSerieColor(serieIdx))
      .attr('r', 3)
      .style('pointer-events', 'none');
  }

  public renderSharedCrosshair(timestamp: number): void {
    this._crosshair.style('display', null);
    this._crosshair.selectAll('.crosshair-circle')
      .style('display', 'none');

    const x = this.xScale(timestamp);
    this._crosshair.select('#crosshair-line-x')
      .attr('y1', 0).attr('x1', x)
      .attr('y2', this.height).attr('x2', x);
  }

  public hideSharedCrosshair(): void {
    this._crosshair.style('display', 'none');
  }

  moveCrosshairLine(xPosition: number): void {
    this._crosshair.select('#crosshair-line-x')
      .attr('x1', xPosition)
      .attr('x2', xPosition);
  }

  moveCrosshairCircle(xPosition: number, yPosition: number, serieIdx: number): void {
    this._crosshair.selectAll(`.crosshair-circle-${serieIdx}`)
      .attr('cx', xPosition)
      .attr('cy', yPosition);
  }

  hideCrosshairCircle(serieIdx: number): void {
    // hide circle for singe serie
    this._crosshair.selectAll(`.crosshair-circle-${serieIdx}`)
      .style('display', 'none');
  }

  getClosestDatapoint(serie: LineTimeSerie, xPosition: number): [number, number] {
    // xPosition - chart x-coordinate
    // get closest datapoint to the "xPosition" in the "serie"
    const datapoints = serie.datapoints;
    const xValue = this.xScale.invert(xPosition);
    const closestIdx = this.getClosetIndex(datapoints, xValue);
    const datapoint = serie.datapoints[closestIdx];
    return datapoint;
  }

  getClosetIndex(datapoints: [number, number][], xValue: number): number {
    // TODO: d3.bisect is not the best way. Use binary search
    const bisectIndex = this._d3.bisector((d: [number, number]) => d[1]).left;
    let closestIdx = bisectIndex(datapoints, xValue);
    // TODO: refactor corner cases
    if(closestIdx < 0) {
      return 0;      
    }
    if(closestIdx >= datapoints.length) {
      return datapoints.length - 1;
    }
    // TODO: do we realy need it? Binary search should fix it
    if(
      closestIdx > 0 &&
      Math.abs(xValue - datapoints[closestIdx - 1][1]) <
      Math.abs(xValue - datapoints[closestIdx][1])
    ) {
      closestIdx -= 1;
    }
    return closestIdx;
  }

  onMouseMove(): void {
    const eventX = this._d3.mouse(this._chartContainer.node())[0];
    // TODO: isOutOfChart is a hack, use clip path correctly
    if(this.isOutOfChart() === true) {
      this._crosshair.style('display', 'none');
      return;
    }
    this.moveCrosshairLine(eventX);

    if(this._series === undefined || this._series.length === 0) {
      return;
    }

    // TODO: not clear what points is, refactor mouse move callback
    let points = [];
    this._series.forEach((serie: LineTimeSerie, serieIdx: number) => {
      if(
        serie.visible === false ||
        _.includes(this.seriesTargetsWithBounds, serie.target)
      ) {
        this.hideCrosshairCircle(serieIdx);
        return;
      }
      // TODO: add smth like voronoi
      const closetDatapoint = this.getClosestDatapoint(serie, eventX);
      const yPosition = this.yScale(closetDatapoint[0]);
      const xPosition = this.xScale(closetDatapoint[1]);
      this.moveCrosshairCircle(xPosition, yPosition, serieIdx);

      points.push({
        value: closetDatapoint[0],
        color: this.getSerieColor(serieIdx),
        label: serie.alias || serie.target
      });
    });
  
    if(this._options.eventsCallbacks === undefined || this._options.eventsCallbacks.mouseMove === undefined) {
      console.log('Mouse move, but there is no callback');
      return;
    }

    // TODO: need to refactor this object
    this._options.eventsCallbacks.mouseMove({
      x: this._d3.event.pageX,
      y: this._d3.event.pageY,
      time: this.xScale.invert(eventX),
      series: points,
      chartX: eventX,
      chartWidth: this.width
    });
  }

  onMouseOver(): void {
    this._crosshair.style('display', null);
    this._crosshair.selectAll('.crosshair-circle')
      .style('display', null);
  }

  onMouseOut(): void {
    if(this._options.eventsCallbacks !== undefined && this._options.eventsCallbacks.mouseOut !== undefined) {
      this._options.eventsCallbacks.mouseOut();
    }
    this._crosshair.style('display', 'none');
  }
}

// it is used with Vue.component, e.g.: Vue.component('chartwerk-line-chart', VueChartwerkLineChartObject)
export const VueChartwerkLineChartObject = {
  // alternative to `template: '<div class="chartwerk-line-chart" :id="id" />'`
  render(createElement) {
    return createElement(
      'div',
      {
        class: { 'chartwerk-line-chart': true },
        attrs: { id: this.id }
      }
    );
  },
  mixins: [VueChartwerkBaseMixin],
  methods: {
    render() {
      const pod = new ChartwerkLineChart(document.getElementById(this.id), this.series, this.options);
      pod.render();
    }
  }
};

export { LineTimeSerie, LineOptions, Mode, TickOrientation, TimeFormat };
