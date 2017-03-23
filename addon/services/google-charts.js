import Ember from 'ember';

const { RSVP, Service } = Ember;

export default Service.extend({
  googlePackages: ['corechart', 'bar', 'line', 'scatter'],
  language: 'en',

  init() {
    this._super(...arguments);
    this._startLoad();
  },

<<<<<<< c9c997ae6672bd0ef75e0eb293a540d9aff123de
  _startLoad() {
    const { google } = window;

=======
  init() {
    this._super(...arguments);
    this._startLoad();
  },

  _startLoad() {
    const { google } = window;

>>>>>>> Clean up async chart loading
    google.charts.load('current', {
      language: this.get('language'),
      packages: this.get('googlePackages'),
    });
  },

  loadPackages() {
    const { google } = window;

    return new RSVP.Promise((resolve, reject) => {
      google.charts.setOnLoadCallback((ex) => {
        if (ex) {
          reject(ex);
        }
        resolve();
      });
    });
  },
});
