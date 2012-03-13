
Utils = {};

Utils.buildQuery = function(params) {
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
  }).join('&');
};

Utils.escapeHtml = function(text) {
  var pre = document.createElement('pre');
  pre.textContent = text;
  return pre.innerHTML;
};
