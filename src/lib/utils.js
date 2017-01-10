var Utils = (function() {

var buildQuery = function(params) {
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
  }).join('&');
};

var parseQuery = function(query) {
  var result = {};

  if(!query) {
    query = location.search.substring(1);
  }
  query.split('&').forEach(function(param) {
    var pair = param.split('=');
    if(pair.length == 2) {
      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  });
  return result;
};

var escapeHtml = function(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

return {
  buildQuery: buildQuery,
  parseQuery: parseQuery,
  escapeHtml: escapeHtml
};

})();
