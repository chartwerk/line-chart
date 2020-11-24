import { ChartwerkBase, VueChartwerkBaseMixin, TickOrientation, TimeFormat } from '@chartwerk/base';
import { LineTimeSerie, LineOptions, Mode } from './types';

import * as d3 from 'd3';
import * as _ from 'lodash';


export class ChartwerkLineChart extends ChartwerkBase<LineTimeSerie, LineOptions> {
  constructor(el: HTMLElement, _series: LineTimeSerie[] = [], _options: LineOptions = {}) {
    super(d3, el, _series, _options);
  }

  _renderMetrics(): void {
    if(this._series.length === 0) {
      this._renderNoDataPointsMessage();
      return;
    }
    // TODO: temporary
    this._updateCrosshairCircles();
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

  _updateCrosshairCircles(): void {
    this._crosshair
      .append('circle')
      .attr('class', 'crosshair-circle')
      .attr('r', 3);
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

  onMouseMove(): void {
    const eventX = this._d3.mouse(this._chartContainer.node())[0];
    if(this.isOutOfChart() === true) {
      this._crosshair.style('display', 'none');
      return;
    }
    this._crosshair.select('#crosshair-line-x')
      .attr('x1', eventX)
      .attr('x2', eventX);

    if(this._series === undefined || this._series.length === 0) {
      return;
    }

    const bisectDate = this._d3.bisector((d: [number, number]) => d[1]).left;
    // TODO: axis can be number or Date
    const mouseDate = this.xScale.invert(eventX);

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
        this._crosshair.selectAll(`.crosshair-circle-${i}`)
          .style('display', 'none');
        continue;
      }
      const y = this.yScale(this._series[i].datapoints[idx][0]);
      const x = this.xScale(this._series[i].datapoints[idx][1]);

      series.push({
        value: this._series[i].datapoints[idx][0],
        color: this.getSerieColor(i),
        label: this._series[i].alias || this._series[i].target
      });

      this._crosshair.selectAll(`.crosshair-circle`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('fill', this.getSerieColor(i));
    }
  
    if(this._options.eventsCallbacks === undefined || this._options.eventsCallbacks.mouseMove === undefined) {
      console.log('Mouse move, but there is no callback');
      return;
    }

    this._options.eventsCallbacks.mouseMove({
      x: this._d3.event.pageX,
      y: this._d3.event.pageY,
      time: this.xScale.invert(eventX),
      series,
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
