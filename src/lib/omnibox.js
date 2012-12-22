/*
 * Copyright (c) 2012 mono
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function() {

var currentQuery = null;
var searchResult = [];
var searchOffset = 0;
var currentOffset = 0;

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

var parseQuery = function(query, migemo) {
  if(migemo) {
    return Migemo.query(currentQuery).pipe(function(result) {
      if(!result) {
        return $.Deferred().reject();
      }
      return result.split(/(?:\\s\*)+/).map(function(part) {
        return new RegExp(part, 'i');
      });
    }).pipe(null, function() {
      return parseQuery(query, false);
    });
  }
  else {
    var deferred = $.Deferred();
    var split = currentQuery.split(/\s+/);
    if(split.length > 0) {
      deferred.resolve(split.map(function(word) {
        return new RegExp(word.replace(/\W/g, '\\$&'), 'ig');
      }));
    }
    else {
      deferred.reject();
    }
    return deferred.promise();
  }
};

var search = function(posts, text, suggest, migemo) {
  var post, str, split, matcher;
  var limit = 5;
  var offset = 0;

  if(!text.match(/^(.*?[^\.].*?)\s*(\.*)$/)) {
    return;
  }

  offset = currentOffset = RegExp.$2.length * limit;
  if(currentQuery != RegExp.$1) {
    currentQuery = RegExp.$1;
    searchResult = [];
    searchOffset = 0;
  }

  parseQuery(currentQuery, migemo).done(function(query) {
    var highlight = new RegExp(query.map(function(word) {
      return word.source;
    }).join('|'), 'ig');

    if(searchResult.length < offset + limit) {
      matcher = function(q) { return str.match(q); };
      while(searchOffset < posts.length) {
        post = posts[searchOffset];
        searchOffset += 1;

        str = post.description + post.tags + post.extended;
        if(query.every(matcher)) {
          searchResult.push(post);
          if(searchResult.length >= offset + limit) {
            break;
          }
        }
      }
    }

    suggest(searchResult.slice(offset, offset + limit).map(function(post) {
      return createSuggest(post, highlight);
    }));
  });
};

chrome.omnibox.setDefaultSuggestion({
  description: 'Search my posts for <match>%s</match>'
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  $.when(
    Pinboard.posts(),
    Pinboard.get([ 'enable_migemo' ])
  ).done(function(posts, data) {
    search(posts, text, suggest, data.enable_migemo);
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
        query: text,
        mine: 'Search Mine'
      };
      chrome.tabs.update(tab.id, { url: 'https://pinboard.in/search/?' + Utils.buildQuery(params) });
    });
  }
});

chrome.omnibox.onInputCancelled.addListener(function() {
});

})();
