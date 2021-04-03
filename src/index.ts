import { ChartwerkPod, VueChartwerkPodMixin, TickOrientation, TimeFormat } from '@chartwerk/core';
import { LineTimeSerie, LineOptions, Mode } from './types';

import * as d3 from 'd3';
import * as _ from 'lodash';

const CROSSHAIR_CIRCLE_RADIUS = 3;
const CROSSHAIR_BACKGROUND_RAIDUS = 9;
const CROSSHAIR_BACKGROUND_OPACITY = 0.3;

export class ChartwerkLineChart extends ChartwerkPod<LineTimeSerie, LineOptions> {
  lineGenerator = null;

  constructor(_el: HTMLElement, _series: LineTimeSerie[] = [], _options: LineOptions = {}) {
    super(d3, _el, _series, _options);
  }

  renderMetrics(): void {
    // TODO: seems that renderMetrics is not correct name 
    if(this.series.length === 0) {
      this.renderNoDataPointsMessage();
      return;
    }
    this.updateCrosshair();
    this.initLineGenerator();

    for(let idx = 0; idx < this.series.length; ++idx) {
      if(this.series[idx].visible === false) {
        continue;
      }
      const confidence = this.series[idx].confidence || 0;
      const mode = this.series[idx].mode || Mode.STANDARD;
      const target = this.series[idx].target;
      this._renderMetric(
        this.series[idx].datapoints,
        { color: this.getSerieColor(idx), confidence, target, mode, serieIdx: idx }
      );
    }
  }

  initLineGenerator(): void {
    this.lineGenerator = this.d3.line()
      .x(d => this.xScale(d[1]))
      .y(d => this.yScale(d[0]));
  }

  public appendData(data: [number, number][]): void {
    this.clearScaleCache();

    for(let idx = 0; idx < this.series.length; ++idx) {
      if(this.series[idx].visible === false) {
        continue;
      }
      this.series[idx].datapoints.push(data[idx]);
      const maxLength = this.series[idx].maxLength;
      if(maxLength !== undefined && this.series[idx].datapoints.length > maxLength) {
        this.series[idx].datapoints.shift();
      }
      this.chartContainer.select(`.metric-path-${idx}`)
        .datum(this.series[idx].datapoints)
        .attr('d', this.lineGenerator);
    }

    this.renderXAxis();
    this.renderYAxis();
    this.renderGrid();
  }

  _renderMetric(
    datapoints: number[][],
    metricOptions: {
      color: string,
      confidence: number,
      target: string,
      mode: Mode,
      serieIdx: number
    }
  ): void {
    if(_.includes(this.seriesTargetsWithBounds, metricOptions.target)) {
      return;
    }

    if(metricOptions.mode === Mode.CHARGE) {
      const dataPairs = this.d3.pairs(datapoints);
      this.chartContainer.selectAll(null)
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

    this.chartContainer
      .append('path')
      .datum(datapoints)
      .attr('class', `metric-path-${metricOptions.serieIdx}`)
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', 'none')
      .attr('stroke', metricOptions.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.7)
      .attr('d', this.lineGenerator);

    let upperBoundDatapoints = [];
    let lowerBoundDatapoints = [];
    if(
      this.options.bounds !== undefined &&
      this.options.bounds.upper !== undefined &&
      this.options.bounds.lower !== undefined
    ) {
      this.series.forEach(serie => {
        if(serie.target === this.formatedBound(this.options.bounds.upper, metricOptions.target)) {
          upperBoundDatapoints = serie.datapoints;
        }
        if(serie.target === this.formatedBound(this.options.bounds.lower, metricOptions.target)) {
          lowerBoundDatapoints = serie.datapoints;
        }
      });
    }

    if(upperBoundDatapoints.length > 0 && lowerBoundDatapoints.length > 0) {
      const zip = (arr1, arr2) => arr1.map((k, i) => [k[0],k[1], arr2[i][0]]);
      const data = zip(upperBoundDatapoints, lowerBoundDatapoints);

      this.chartContainer.append('path')
        .datum(data)
        .attr('fill', metricOptions.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this.d3.area()
          .x((d: number[]) => this.xScale(d[1]))
          .y0((d: number[]) => this.yScale(d[0]))
          .y1((d: number[]) => this.yScale(d[2]))
        )
    }

    if(metricOptions.confidence > 0) {
      this.chartContainer.append('path')
        .datum(datapoints)
        .attr('fill', metricOptions.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this.d3.area()
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
    this.series.forEach((serie: LineTimeSerie, serieIdx: number) => {
      this.appendCrosshairCircle(serieIdx);
    });
  }

  appendCrosshairCircle(serieIdx: number): void {
    this.crosshair.append('circle')
      .attr('class', `crosshair-circle-${serieIdx} crosshair-background`)
      .attr('r', CROSSHAIR_BACKGROUND_RAIDUS)
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', this.getSerieColor(serieIdx))
      .style('opacity', CROSSHAIR_BACKGROUND_OPACITY)
      .style('pointer-events', 'none');
    
    this.crosshair
      .append('circle')
      .attr('class', `crosshair-circle-${serieIdx}`)
      .attr('clip-path', `url(#${this.rectClipId})`)
      .attr('fill', this.getSerieColor(serieIdx))
      .attr('r', CROSSHAIR_CIRCLE_RADIUS)
      .style('pointer-events', 'none');
  }

  public renderSharedCrosshair(timestamp: number): void {
    this.crosshair.style('display', null);
    this.crosshair.selectAll('.crosshair-circle')
      .style('display', 'none');

    const x = this.xScale(timestamp);
    this.crosshair.select('#crosshair-line-x')
      .attr('y1', 0).attr('x1', x)
      .attr('y2', this.height).attr('x2', x);
  }

  public hideSharedCrosshair(): void {
    this.crosshair.style('display', 'none');
  }

  moveCrosshairLine(xPosition: number): void {
    this.crosshair.select('#crosshair-line-x')
      .attr('x1', xPosition)
      .attr('x2', xPosition);
  }

  moveCrosshairCircle(xPosition: number, yPosition: number, serieIdx: number): void {
    this.crosshair.selectAll(`.crosshair-circle-${serieIdx}`)
      .attr('cx', xPosition)
      .attr('cy', yPosition)
      .style('display', null);
  }

  hideCrosshairCircle(serieIdx: number): void {
    // hide circle for singe serie
    this.crosshair.selectAll(`.crosshair-circle-${serieIdx}`)
      .style('display', 'none');
  }

  getClosestDatapoint(serie: LineTimeSerie, xValue: number): [number, number] {
    // get closest datapoint to the "xValue" in the "serie"
    const datapoints = serie.datapoints;
    const closestIdx = this.getClosestIndex(datapoints, xValue);
    const datapoint = serie.datapoints[closestIdx];
    return datapoint;
  }

  getClosestIndex(datapoints: [number, number][], xValue: number): number {
    // TODO: d3.bisect is not the best way. Use binary search
    const bisectIndex = this.d3.bisector((d: [number, number]) => d[1]).left;
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

  get xValueInterval(): number | undefined {
    // TODO: move it to base instead of timeInterval
    // inverval: x value interval between data points
    const intervals = _.map(this.series, serie => {
      if(serie.datapoints.length < 2) {
        return undefined;
      }
      const startX = _.head(serie.datapoints)[1];
      const endX = _.last(serie.datapoints)[1];
      const xRange = Math.abs(endX - startX);
      const interval = xRange / (serie.datapoints.length - 1);
      return interval;
    });
    return _.max(intervals);
  }

  onMouseMove(): void {
    const eventX = this.d3.mouse(this.chartContainer.node())[0];
    // TODO: isOutOfChart is a hack, use clip path correctly
    if(this.isOutOfChart() === true) {
      this.crosshair.style('display', 'none');
      return;
    }
    this.moveCrosshairLine(eventX);

    if(this.series === undefined || this.series.length === 0) {
      return;
    }

    // TODO: not clear what points is, refactor mouse move callback
    let points = [];
    this.series.forEach((serie: LineTimeSerie, serieIdx: number) => {
      if(
        serie.visible === false ||
        _.includes(this.seriesTargetsWithBounds, serie.target)
      ) {
        this.hideCrosshairCircle(serieIdx);
        return;
      }
      const xValue = this.xScale.invert(eventX); // mouse x position in xScale
      const closestDatapoint = this.getClosestDatapoint(serie, xValue);
      if(closestDatapoint === undefined) {
        this.hideCrosshairCircle(serieIdx);
        return;
      }

      const range = Math.abs(closestDatapoint[1] - xValue);
      const interval = this.xValueInterval; // interval between points
      // do not move crosshair circles, it mouse to far from closest point
      if(interval === undefined || range > interval / 2) {
        this.hideCrosshairCircle(serieIdx);
        return;
      }
      const yPosition = this.yScale(closestDatapoint[0]);
      const xPosition = this.xScale(closestDatapoint[1]);
      this.moveCrosshairCircle(xPosition, yPosition, serieIdx);

      points.push({
        value: closestDatapoint[0],
        color: this.getSerieColor(serieIdx),
        label: serie.alias || serie.target
      });
    });
  
    if(this.options.eventsCallbacks === undefined || this.options.eventsCallbacks.mouseMove === undefined) {
      console.log('Mouse move, but there is no callback');
      return;
    }

    // TODO: need to refactor this object
    this.options.eventsCallbacks.mouseMove({
      x: this.d3.event.pageX,
      y: this.d3.event.pageY,
      time: this.xScale.invert(eventX),
      series: points,
      chartX: eventX,
      chartWidth: this.width
    });
  }

  onMouseOver(): void {
    this.crosshair.style('display', null);
    this.crosshair.selectAll('.crosshair-circle')
      .style('display', null);
  }

  onMouseOut(): void {
    if(this.options.eventsCallbacks !== undefined && this.options.eventsCallbacks.mouseOut !== undefined) {
      this.options.eventsCallbacks.mouseOut();
    }
    this.crosshair.style('display', 'none');
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
  mixins: [VueChartwerkPodMixin],
  methods: {
    render() {
      const pod = new ChartwerkLineChart(document.getElementById(this.id), this.series, this.options);
      pod.render();
    }
  }
};

export { LineTimeSerie, LineOptions, Mode, TickOrientation, TimeFormat };
