Hue = {
  __ : {
    api : null,
    lights : {}
  },

  config : {
    rootPath: "http://cute.local:80/api/_"
  },

  fn : {
    init: function(){
      // TODO: Load configs from localStorage

      Hue.__.api = new HueApi( Hue.config.rootPath );
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
        },
        function(error) {
          console.log("Couldn't refresh lights.", error);
        }
      );
    },

    // Render lights from api response object
    renderLights: function() {

    }
  }
};

docReady( Hue.fn.init );