import { ChartwerkBase, TimeSerie, Options } from '@chartwerk/base';

import * as d3 from 'd3';
import * as _ from 'lodash';

export class ChartwerkLineChart extends ChartwerkBase {
  constructor(el: HTMLElement, _series: TimeSerie[] = [], _options: Options = {}) {
    super(d3, el, _series, _options);
  }

  // TODO: private, type for timeseries
  _renderMetrics(): void {
    for(const i in this._series) {
      // @ts-ignore
      this._series[i].color = this._options.colors[i];
    }
    if(this.visibleSeries.length > 0) {
      for(const idx in this.visibleSeries) {
        // @ts-ignore
        const confidence = this.visibleSeries[idx].confidence || 0;
        //@ts-ignore
        const mode = this.visibleSeries[idx].mode || 'Standart';
        const target = this.visibleSeries[idx].target;
        this._renderMetric(
          this.visibleSeries[idx].datapoints,
          { color: this.visibleSeries[idx].color, confidence, target, mode }
        );
      }
    } else {
      this._renderNoDataPointsMessage();
    }
    this._renderCrosshair();
    this._useBrush();
  }

  _renderNoDataPointsMessage(): void {
    this._chartContainer.append('text')
      .attr('class', 'alert-text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'currentColor')
      .text('No data points');
  }

  _renderMetric(datapoints: number[][], options: { color: string, confidence: number, target: string, mode: string }): void {
    if(_.includes(this.seriesTargetsWithBounds, options.target)) {
      return;
    }

    if(options.mode === 'Charge') {
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
      .x((d: [number, number]) => this.xScale(new Date(d[1])))
      .y((d: [number, number]) => this.yScale(d[0]));

    // TODO: clip
    this._chartContainer
      .append('path')
      .datum(datapoints)
      .attr('class', 'metric-path')
      .attr('fill', 'none')
      .attr('stroke', options.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.7)
      .attr('d', lineGenerator);

    let upperBoundDatapoints = [];
    let lowerBoundDatapoints = [];
    this._series.forEach(serie => {
      if(serie.target === this.formatedBound(this._options.bounds.upper, options.target)) {
        upperBoundDatapoints = serie.datapoints;
      }
      if(serie.target === this.formatedBound(this._options.bounds.lower, options.target)) {
        lowerBoundDatapoints = serie.datapoints;
      }
    });

    if(upperBoundDatapoints.length > 0 && lowerBoundDatapoints.length > 0) {
      const zip = (arr1, arr2) => arr1.map((k, i) => [k[0],k[1], arr2[i][0]]);
      const data = zip(upperBoundDatapoints, lowerBoundDatapoints);

      this._chartContainer.append('path')
        .datum(data)
        .attr('fill', options.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this._d3.area()
          .x((d: number[]) => this.xScale(new Date(d[1])))
          .y0((d: number[]) => this.yScale(d[0]))
          .y1((d: number[]) => this.yScale(d[2]))
        )
    }

    if(options.confidence > 0) {
      this._chartContainer.append('path')
        .datum(datapoints)
        .attr('fill', options.color)
        .attr('stroke', 'none')
        .attr('opacity', '0.3')
        .attr('d', this._d3.area()
          .x((d: [number, number]) => this.xScale(new Date(d[1])))
          .y0((d: [number, number]) => this.yScale(d[0] + options.confidence))
          .y1((d: [number, number]) => this.yScale(d[0] - options.confidence))
        )
    }
  }

  _renderCrosshair(): void {
    this._crosshair = this._chartContainer.append('g')
      .style('display', 'none');

    this._crosshair.append('line')
      .attr('class', 'crosshair-line')
      .attr('id', 'crosshair-line-x')
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', '0.5px');

    for(let i = 0; i < this._series.length; i++) {
      this._crosshair.append('circle')
        .attr('class', 'crosshair-circle')
        .attr('id', `crosshair-circle-${i}`)
        .attr('r', 2)
        .style('fill', 'white')
        .style('stroke', 'red')
        .style('stroke-width', '1px');
    }

    this._chartContainer.append('rect')
      .style('fill', 'none')
      .style('stroke', 'none')
      .style('pointer-events', 'all')
      .style('cursor', 'crosshair')
      .attr('width', this.width)
      .attr('height', this.height);
  }

  _useBrush(): void {
    this._brush = this._d3.brushX()
      .extent([
        [0, 0],
        [this.width, this.height]
      ])
      .handleSize(20)
      .filter(() => !this._d3.event.shiftKey)
      .on('end', this.onBrushEnd.bind(this))

    this._chartContainer
      .call(this._brush)
      .on('mouseover', this.onMouseOver.bind(this))
      .on('mouseout', this.onMouseOut.bind(this))
      .on('mousemove', this.onMouseMove.bind(this))
      .on('dblclick', this.zoomOut.bind(this));
  }

  onMouseMove(): void {
    const eventX = this._d3.mouse(this._chartContainer.node())[0];
    if(this.isOutOfChart() === true) {
      this._crosshair.style('display', 'none');
      return;
    }
    this._crosshair.select('#crosshair-line-x')
      .attr('y1', 0).attr('x1', eventX)
      .attr('y2', this.yScale(this.minValue)).attr('x2', eventX);
      
    if(this._series === undefined || this._series.length === 0) {
      return;
    }

    const bisectDate = this._d3.bisector((d: [number, number]) => d[1]).left;
    const mouseDate = this.xTimeScale.invert(eventX).getTime();

    let idx = bisectDate(this._series[0].datapoints, mouseDate);
    if(
      Math.abs(mouseDate - this._series[0].datapoints[idx - 1][1]) <
      Math.abs(mouseDate - this._series[0].datapoints[idx][1])
    ) {
      idx -= 1;
    }

    const series: any[] = [];
    for(let i = 0; i < this._series.length; i++) {
      if(
        this._series[i].visible === false ||
        _.includes(this.seriesTargetsWithBounds, this._series[i].target)        
      ) {
        this._crosshair.select(`#crosshair-circle-${i}`)
          .style('display', 'none');
        continue;
      }
      const y = this.yScale(this._series[i].datapoints[idx][0]);
      const x = this.xScale(this._series[i].datapoints[idx][1]);

      series.push({
        value: this._series[i].datapoints[idx][0],
        color: this._options.colors[i],
        label: this._series[i].alias || this._series[i].target
      });

      this._crosshair.select(`#crosshair-circle-${i}`)
        .attr('cx', x)
        .attr('cy', y);
    }

    this._options.eventsCallbacks.mouseMove({
      x: this._d3.event.clientX,
      y: this._d3.event.clientY,
      time: this._series[0].datapoints[idx][1],
      series
    });
  }

  onMouseOver(): void {
    this._crosshair.style('display', null);
  }

  onMouseOut(): void {
    this._options.eventsCallbacks.mouseOut();
    this._crosshair.style('display', 'none');
  }

  onBrushEnd(): void {
    const extent = this._d3.event.selection;
    if(extent === undefined || extent === null || extent.length < 2) {
      return;
    }
    const startTimestamp = this.xTimeScale.invert(extent[0]).getTime();
    const endTimestamp = this.xTimeScale.invert(extent[1]).getTime();
    const range: [number, number] = [startTimestamp, endTimestamp];
    this._chartContainer
      .call(this._brush.move, null);
    if(this._options.eventsCallbacks !== undefined && this._options.eventsCallbacks.zoomIn !== undefined) {
      this._options.eventsCallbacks.zoomIn(range);
    } else {
      console.log('zoom in, but there is no callback');
    }
  }

  zoomOut(): void {
    if(this.isOutOfChart() === true) {
      return;
    }
    const midTimestamp = this.xTimeScale.invert(this.width / 2).getTime();
    if(this._options.eventsCallbacks !== undefined && this._options.eventsCallbacks.zoomOut !== undefined) {
      this._options.eventsCallbacks.zoomOut(midTimestamp);
    } else {
      console.log('zoom out, but there is no callback');
    }
  }
}
