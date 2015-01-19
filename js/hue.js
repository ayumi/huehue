Hue = {
  __ : {
    api : null,
    rac : null,
    lights : {}
  },

  config : {
    rootPath: "http://cute.local:80/api/_",
    pollInterval: 5000
  },

  fn : {
    init: function(){
      // TODO: Load configs from localStorage

      Hue.__.api = new HueApi( Hue.config.rootPath );

      Hue.__.rac = new Ractive({
        el: 'app',
        template: '#_app',
        data: {
          lights: []
        }
      });

      // Ractive data bindings
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

      // Poll for changess
      setInterval( Hue.fn.refreshLights, Hue.config.pollInterval ),

      // This will update the Lights object
      Hue.fn.refreshLights();
    },

    // Reload lights from API
    refreshLights: function() {
      Hue.__.api.getLights().then(
        function(response) {
          _.each(response, function(apiLight, id) {
            if ( Hue.__.lights[id] ) {
              Hue.__.lights[id].sync(apiLight);
            } else {
              Hue.__.lights[id] = new HueLight( Hue.__.api, id, apiLight );
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