
Utils = {};

Utils.buildQuery = function(params) {
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
  }).join('&');
};

Utils.escapeHtml = function(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

Utils.normalize = function(str) {
  str = HanZenKaku.h2z(str);
  str = HanZenKaku.k2h(str);
  str = HanZenKaku.fw2hw(str);
  str = str.replace(/ー/g, '-');
  return str;
};
