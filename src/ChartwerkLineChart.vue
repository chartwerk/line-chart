<template>
  <div class="chartwerk-line-chart" :id="id">
  </div>
</template>

<script>
import ChartwerkBase from '@chartwerk/base/dist/ChartwerkBase.vue';

import { ChartwerkLineChart } from '@chartwerk/line-chart';

import Vue from 'vue';

import * as _ from 'lodash';

export default ChartwerkBase.extend({
  methods: {
    render() {
      new ChartwerkLineChart(document.getElementById(this.id), this.series, this.options);
    }
  }
})
</script>

<style scoped>
.vue-chartwerk-base {
  width: 100%;
  height: 100%;
}
</style>
