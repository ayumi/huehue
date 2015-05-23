// The basic operable unit.
// Usually you'll do stuff to lights using this object.

// args
//   api: HueApi instance
//   id:  API light ID
//   obj: API response object
//   onSync: Callback after data syncs from API (e.g. render in view)
var HueLight = function(args) {
  this.api = args.api;
  this.id = args.id;
  this.onSync = args.onSync;
  this.sync( args.obj );

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
  this.type      = obj.type;
  this.swversion = obj.swversion;
  this.state     = obj.state;
  this.pickerHsv = this.getHsv();
  this.putStateBuffer = {};

  if ( typeof this.onSync === 'function' ) {
    this.onSync.call();
  }
};

// Hue API has hue/sat/bri as 0-65535, 0-255, 0-255
// HSV for ColorPicker is 0-360, 0-1, 0-1
HueLight.prototype.getHsv = function() {
  return {
    h: this.state.hue / (65535 / 360),
    s: this.state.sat / 255,
    v: this.state.bri / 255,
  };
};

// From HSV, set the state.hue, .sat, .bri
HueLight.prototype.setHsv = function(hsv) {
  var newState = {
    hue: parseInt( hsv.h * (65535 / 360) ),
    sat: parseInt( hsv.s * 255 ),
    bri: parseInt( hsv.v * 255 )
  };
  this.stateChanged(newState);
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
    var normChanges = this.getNormState(changes);
    this.bufferedPutState(normChanges);
  }
};

// Sometimes it's necessary to add attributes onto state changes, e.g. for
// effect you need effectspread and transtiiontime.
HueLight.prototype.getNormState = function(state) {
  var attrGroups = [ ['bri', 'effect', 'effectspread', 'transitiontime'] ];
  var stateAttrs = _.keys(state);
  var _this = this;
  _.each( attrGroups, function(attrGroup) {
    var attrDiffGroupState = _.difference( attrGroup, stateAttrs );
    // grouped attrs present
    if ( _.size(attrDiffGroupState) < _.size(attrGroup) ) {
      _.each( attrDiffGroupState, function(missingAttr) {
        state[missingAttr] = _this.state[missingAttr];
      });
    }
  });
  return state;
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

HueLight.prototype.setChromaticity = function(ct) {
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
