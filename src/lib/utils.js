
Utils = {};

Utils.buildQuery = function(params) {
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
  }).join('&');
};

Utils.escapeHtml = function(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
