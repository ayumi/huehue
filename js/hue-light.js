var HueLight = function(api, id, obj) {
  this.api = api;
  this.id = id;
  this.sync(obj);

  // Setup buffered putState
  this.putStateBuffer = {};
  var _this = this;
  setInterval( function(){
    _this.flushPutStateBuffer();
  }, 200 );
};

// Update state from api response
HueLight.prototype.sync = function(obj) {
  this.modelid   = obj.modelid;
  this.name      = obj.name;
  this.swversion = obj.swversion;
  this.state =     obj.state;
  this.type      = obj.type;
  this.putStateBuffer = {};
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

// Avoid spamming network requests
HueLight.prototype.bufferedPutState = function(newState){
  _.extend( this.putStateBuffer, newState );
};

// Runs periodically to flush put state buffers
HueLight.prototype.flushPutStateBuffer = function() {
  if ( _.size( this.putStateBuffer ) > 0 ) {
    this.putState( this.putStateBuffer );
    this.putStateBuffer = {};
  }
};

HueLight.prototype.stateChanged = function(newState) {
  // If there's a difference, PUT to API
  var oldState = this.state;
  var changes =
    _.pick(newState, function(newValue, key) {
      // Fun JS Fact: Array [0, 0] != Array [0, 0]
      return !( _.isEqual( oldState[key], newValue ) );
    });
  if ( _.size(changes) > 0 ){
    this.bufferedPutState(changes);
  }
};

HueLight.prototype.on = function() {
  this.putState({on: true});
};

HueLight.prototype.off = function() {
  // NOTE: Effect needs to 'none'
  this.putState({on: false});
};

HueLight.prototype.setBrightness = function(bri) {
  this.putState({bri: bri});
};

HueLight.prototype.setBri = function(bri) {
  this.setBrightness(bri);
};

HueLight.prototype.setCromaticity = function(ct) {
  this.putState({ct: ct});
};

HueLight.prototype.setCt = function(ct) {
  this.setChromaticity(ct);
};

HueLight.prototype.setHue = function(hue) {
  this.putState({hue: hue});
};

HueLight.prototype.setSat = function(sat) {
  this.putState({sat: sat});
};

HueLight.prototype.setEffect = function(effect, transitionTime) {
  var newState = {effect: effect};
  if (transitionTime) {
    newState.transitionTime = transitionTime;
  }
  this.putState(newState);
};

HueLight.prototype.setXY = function(xyArr) {
  this.putState(xyArr);
};