var HueLight = function(api, id, obj) {
  this.api = api;
  this.id = id;
  this.sync(obj);
};

// Update state after receiving it from the api
HueLight.prototype.sync = function(obj) {
  this.modelid   = obj.modelid;
  this.name      = obj.name;
  this.swversion = obj.swversion;
  this.state =     obj.state;
  this.type      = obj.type;
};

HueLight.prototype.basePath = function() {
  return ( '/lights/' + this.id );
};

HueLight.prototype.putState = function(state){
  var _this = this;
  this.api.put( this.basePath() + '/state', state ).then(
    function(apiLight) {
      _this.sync(apiLight);
    },
    function(error) {
      debugger;
      console.log('o darn');
    }
  );
};

HueLight.prototype.on = function() {
  this.putState({on: true});
};

HueLight.prototype.off = function() {
  this.putState({on: false});
};