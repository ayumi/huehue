Hue = {
  __ : {
    api : null,
    rac : null,
    picker : null,
    lights : {}
  },

  config : {
    rootPath: "http://" + window.location.hostname + ":80/api/_",
    pollInterval: 5000
  },

  fn : {
    init: function(){
      // TODO: Load configs from localStorage

      Hue.__.api = new HueApi( Hue.config.rootPath );

      // ColorPicker
      Hue.__.picker = Ractive.extend({
        template: '#_picker',

        onrender: function() {
          var _this = this;
          var container = this.find( '.picker' );
          this.cp = ColorPicker( container, function(hex, hsv, rgb){
            if ( !( _.isEqual( _this.data.pickerHsv, hsv ) ) ) {
              _this.fire( 'hsvChanged', _this.data['light-id'], hsv );
              _this.data.pickerHsv = hsv;
            }
          });

          // Init CP's HSV
          this.cp.setHsv( _this.data.pickerHsv );
        },

        onchange: function(newData) {
          var oldCpHsv = {
            h: this.cp.h,
            s: this.cp.s,
            v: this.cp.v
          };
          if ( !( _.isEqual( oldCpHsv, newData.pickerHsv ) ) ) {
            this.cp.setHsv(newData.pickerHsv);
          }
        }
      });

      Hue.__.rac = new Ractive({
        el: 'app',
        template: '#_app',
        data: {
          lights: []
        },
        components: { picker: Hue.__.picker }
      });

      // Observers
      Hue.__.rac.observe('lights.*.state.*', function(newValue, oldValue, keypath) {
        // keypath: "lights.0.state.bri"
        var keypathParts = keypath.split('.');
        var racId = keypathParts[1];
        var lightId = Hue.__.rac.get( 'lights.' + racId ).id;

        var stateKey = keypathParts[3];
        var newState = {};
        newState[stateKey] = newValue;
        Hue.__.lights[lightId].stateChanged(newState);
      });

      Hue.__.rac.on('*.hsvChanged', function(lightId, hsv) {
        Hue.__.lights[lightId].setHsv(hsv);
      });

      // Poll for changess
      setInterval( Hue.fn.refreshLights, Hue.config.pollInterval ),

      // This will update the Lights object
      Hue.fn.refreshLights();

      // Disable drag events (colorpicker)
      document.addEventListener("dragstart", function( event ) {
        return false;
      }, false);
    },

    // Reload lights from API
    refreshLights: function() {
      Hue.__.api.getLights().then(
        function(response) {
          _.each(response, function(apiLight, id) {
            if ( Hue.__.lights[id] ) {
              Hue.__.lights[id].sync(apiLight);
            } else {
              Hue.__.lights[id] = new HueLight({
                api: Hue.__.api,
                id:  id,
                obj: apiLight,
                onSync: Hue.fn.renderLights
              });
            }
          });
          Hue.fn.renderLights();
        },
        function(error) {
          console.log("Couldn't refresh lights.", error);
        }
      );
    },

    // Render lights from api response object
    renderLights: function() {
      // Turn into Array for Mustache
      var lightList = _.values( Hue.__.lights );
      var cloneLightList = JSON.parse( JSON.stringify(lightList) );
      Hue.__.rac.set( 'lights', cloneLightList );
    }
  }
};

docReady( Hue.fn.init );
