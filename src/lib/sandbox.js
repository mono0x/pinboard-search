jsrender.views.helpers({
  relativeTime: function(datetime) {
    var date = new Date(datetime);
    var diff = new Date() - date;
    var month = [
      "january", "feburaury", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    if(diff > 12 * 7 * 24 * 60 * 60 * 1000) {
      return month[date.getMonth()] + ' ' + date.getFullYear();
    }
    if(diff > 30 * 24 * 60 * 60 * 1000) {
      return Math.floor(diff / 7 / 24 / 60 / 60 / 1000) + ' weeks ago';
    }
    if(diff > 24 * 60 * 60 * 1000) {
      return Math.floor(diff / 24 / 60 / 60 / 1000) + ' days ago';
    }
    if(diff > 60 * 60 * 1000) {
      return Math.floor(diff / 60 / 60 / 1000) + ' hours ago';
    }
    if(diff > 60 * 1000) {
      return Math.floor(diff / 60 / 1000) + ' minutes ago';
    }
    else {
      return Math.floor(diff / 1000) + ' seconds ago';
    }
  }
});

window.onmessage = function(req) {
  var res;
  switch(req.data.action) {
  case 'jsrender':
    jsrender.templates({
      'search-result-item-template': document.getElementById('search-result-item-template').innerHTML
    });
    res = {
      sequence: req.data.sequence,
      html: jsrender.render[req.data.template](req.data.data)
    };
    window.top.postMessage(res, '*');
    break;
  }
};
