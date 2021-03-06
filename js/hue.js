// Entrypoint / Main controller for the app.
// It creates a HueApi object and uses it to load all the HueLights.
// HueLights are rendered via Ractive.js, which syncs data between
// Api and UI.

Hue = {
  __ : {
    api : null,
    rac : null,
    picker : null,
    lights : {}
  },

  config : {
    defaultApiRoot:
      ( window.location.protocol + "//" + window.location.hostname + ":80/api/anykey" ),
    pollInterval: 5000
  },

  fn : {
    getApiRoot: function(){
      var param = Util.fn.queryParam("api_root");
      if ( typeof param === "string" ) {
        if ( param.indexOf("//") === -1 ) {
          param = "//" + param;
        }
        console.log( "getApiRoot: Using query param endpoint: " + param );
        return param;
      }

      console.log( "getApiRoot: Using default endpoint: " + Hue.config.defaultApiRoot + ". Set ?api_root=< Endpoint URL > to customize." );
      return Hue.config.defaultApiRoot;
    },

    init: function(){
      // TODO: Load configs from localStorage

      Hue.__.api = new HueApi( Hue.fn.getApiRoot() );

      // ColorPicker
      Hue.__.picker = Ractive.extend({
        template: '#_picker',

        onrender: function() {
          var _this = this;
          var container = this.find( '.picker' );
          this.cp = ColorPicker( container, function(hex, hsv, rgb){
            if ( !( _.isEqual( _this.get("pickerHsv"), hsv ) ) ) {
              _this.fire( 'hsvChanged', _this.get("light-id"), hsv );
              _this.set("pickerHsv", hsv);
            }
          });

          // Init CP's HSV
          this.cp.setHsv( _this.get("pickerHsv") );
        },

        onchange: function(newData) {
          var oldCpHsv = {
            h: this.cp.h || 0,
            s: this.cp.s || 0,
            v: this.cp.v || 0
          };
          var pickerHsv = {
            h: newData.pickerHsv.h || 0,
            s: newData.pickerHsv.s || 0,
            v: newData.pickerHsv.v || 0
          }
          if ( !( _.isEqual( oldCpHsv, pickerHsv ) ) ) {
            this.cp.setHsv(pickerHsv);
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
