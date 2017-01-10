(function() {

var search;

var entities = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
};

var createSuggest = function(post, highlight) {
  var regexp = new RegExp('(' + highlight.source + ')|([&<>"])', 'ig');
  var title = post.description.replace(regexp, function(s, h, e) {
    if(h) {
      return '<match>' + h.replace(/[&<>"]/, function(s) { return entities[s]; }) + '</match>';
    }
    else if(e) {
      return entities[e];
    }
  });
  return {
    content: post.href,
    description: title + ' <url>' + Utils.escapeHtml(post.href) + '</url>'
  };
};

chrome.omnibox.setDefaultSuggestion({
  description: 'Search my posts for <match>%s</match>'
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  var limit = 5;
  var query;
  var offset = 0;

  if(!text.match(/^(.*?[^\.].*?)\s*(\.*)$/)) {
    return;
  }
  query = RegExp.$1;
  offset = RegExp.$2.length * limit;

  Pinboard.get([ 'enable_migemo' ]).pipe(function(data) {
    if(!search) {
      search = new Search();
    }
    return search.execute(query, data.enable_migemo, limit, offset);
  }).done(function(result, highlight) {
    suggest(result.map(function(post) {
      return createSuggest(post, highlight);
    }));
  });
});

chrome.omnibox.onInputEntered.addListener(function(text) {
  if(text.match(/^https?:\/\//)) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.update(tab.id, { url: text });
    });
  }
  else {
    chrome.tabs.getSelected(null, function(tab) {
      var params = {
        query: text
      };
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('/page.html?' + Utils.buildQuery(params)) });
    });
  }
});

chrome.omnibox.onInputCancelled.addListener(function() {
  search = undefined;
});

})();
