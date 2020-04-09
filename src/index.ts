import { ChartwerkBase, TimeSerie, Options } from '@chartwerk/base';

import * as d3 from 'd3';


export class ChartwerkLineChart extends ChartwerkBase {
  constructor(el: HTMLElement, _series: TimeSerie[] = [], _options: Options = {}) {
    super(d3, el, _series, _options);
  }

  // TODO: private, type for timeseries
  _renderMetrics(): void {
    if(this._series.length > 0) {
      for(const idx in this._series) {
        // @ts-ignore
        const confidence = this._series[idx].confidence || 0;
        this._renderMetric(
          this._series[idx].datapoints,
          { color: this._options.colors[idx], confidence }
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

  _renderMetric(datapoints: number[][], options: { color: string, confidence: number }): void {
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
    const midTimestamp = this.xTimeScale.invert(this.width / 2).getTime();
    if(this._options.eventsCallbacks !== undefined && this._options.eventsCallbacks.zoomOut !== undefined) {
      this._options.eventsCallbacks.zoomOut(midTimestamp);
    } else {
      console.log('zoom out, but there is no callback');
    }
  }
}
