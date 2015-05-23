// Generally useful stuff

Util = {
  fn : {
    queryParam : function(param) {
      var query = window.location.search.substring(1);
      var params = query.split("&");
      for ( var i = 0; i < params.length; i++ ) {
        var keyVal = params[i].split("=");
        if ( keyVal[0] === param ){
          return keyVal[1];
        }
      }
      return null;
    }
  }
};
