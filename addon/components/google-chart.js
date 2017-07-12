import Ember from 'ember';
import { task } from 'ember-concurrency';

const {
  $,
  VERSION,
  Component,
  assert,
  computed,
  inject,
  run: {
    debounce,
  },
  warn,
} = Ember;

const isUsingEmber2 = VERSION.match(/\b2\.\d+.\d+\b/g);

export default Component.extend({

  /* Services */

  googleCharts: inject.service(),

  /* Actions */

  chartDidRender: null,
  packagesDidLoad: null,

  /* Options */

  data: null,
  options: null,
  type: null,

  /* Properties */

  chart: null,
  classNameBindings: ['className'],
  classNames: ['google-chart'],
  responsiveResize: true,

  defaultOptions: computed.reads('googleCharts.defaultOptions'),

  className: computed('type', function() {
    return `${this.get('type')}-chart`;
  }),

  /**
  The default options object with any properties specified
  in the options property overriding specific default options.

  @property mergedOptions
  @public
  */

  mergedOptions: computed('defaultOptions', 'options', function() {
    const defaultOptions = this.get('defaultOptions');
    const options = this.get('options');

    return $.extend({}, defaultOptions, options);
  }),

  /* Lifecycle hooks */

  didInsertElement() {
    this._super(...arguments);
    this.set('firstRender', this.get('setup').perform());

    /* If the Ember version is less than 2.0.0... */

    if (!isUsingEmber2) {
      this.addObserver('data', this, this._rerenderChart);
      this.addObserver('mergedOptions', this, this._rerenderChart);
    }

    if (this.get('responsiveResize')) {
      $(window).on(`resize.${this.get('elementId')}`, () => debounce(this, '_handleResize', 200));
    }
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this._rerenderChart();
  },

  willDestroyElement() {
    this._super(...arguments);
    this._teardownChart();
  },

  /* Methods */

  /**
  The method that components that extend this component should
  overwrite.

  @method renderChart
  @public
  */

  renderChart() {
    assert('You have created a chart type without a renderChart() method');
  },

  setup: task(function* () {
    const type = this.get('type');
    const options = { id: 'setup-dependencies' };

    warn('You did not specify a chart type', type, options);

    yield this.get('googleCharts').loadPackages();
    this.sendAction('packagesDidLoad');
    yield this.get('_renderChart').perform();
  }),

  _rerenderChart() {
    this.get('firstRender').then(() => {
      this.get('_renderChart').perform();
    });
  },

  _handleResize() {
    this.$().css({
      display: 'flex',
    });

    /* Classic charts have an extra parent div */

    let chartContainer = this.$().children().children().css('position') === 'absolute' ? this.$().children() : this.$().children().children();

    chartContainer.css({
      width: '',
      flex: 'auto',
    });

    this._rerenderChart();
  },

  _renderChart: task(function* () {
    const data = this.get('data');
    const mergedOptions = this.get('mergedOptions');
    const chart = yield this.renderChart(data, mergedOptions);

    this.set('chart', chart);
    this.sendAction('chartDidRender', chart);
  }),

  _teardownChart() {
    const chart = this.get('chart');

    if (chart) {
      window.google.visualization.events.removeAllListeners(chart);
      chart.clearChart();
    }

    if (!isUsingEmber2) {
      this.removeObserver('data', this, this._rerenderChart);
      this.removeObserver('mergedOptions', this, this._rerenderChart);
    }

    $(window).off(`resize.${this.get('elementId')}`);
  },

});
