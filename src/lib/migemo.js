var Migemo = (function() {

var EXTENSION_ID = 'dfccgbheolnlopfmahkcjiefggclmadb';

var query = function(q) {
  var deferred = $.Deferred();
  var params = { action: 'getRegExpString', query: q };
  try {
    chrome.runtime.sendMessage(EXTENSION_ID, params, function(response) {
      if(chrome.extension.lastError) {
        deferred.reject(chrome.extension.lastError);
      }
      else {
        deferred.resolve(response.result);
      }
    });
  }
  catch(e) {
    deferred.reject(e);
  }
  return deferred.promise();
};

return {
  query: query
};

})();
