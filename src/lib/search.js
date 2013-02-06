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

var Search = function() {
  var self = this;

  var result = [];
  var searchOffset = 0;

  var currentQueryString;
  var queryCache;

  var parseQueryWithMigemo = function(queryString) {
    return Migemo.query(queryString).pipe(function(result) {
      if(!result) {
        return $.Deferred().reject();
      }
      else {
        return result.split(/(?:\\s\*)+/).map(function(part) {
          return new RegExp(part, 'i');
        });
      }
    }).pipe(null, function() {
      return parseQueryWithoutMigemo(queryString);
    });
  };

  var parseQueryWithoutMigemo = function(queryString) {
    var deferred = $.Deferred();
    var split = queryString.split(/\s+/);
    if(split.length > 0) {
      deferred.resolve(split.map(function(word) {
        return new RegExp(word.replace(/\W/g, '\\$&'), 'ig');
      }));
    }
    else {
      deferred.reject();
    }
    return deferred.promise();
  };

  var parseQuery = function(queryString, migemo) {
    if(migemo) {
      return parseQueryWithMigemo(queryString);
    }
    else {
      return parseQueryWithoutMigemo(queryString);
    }
  };

  var getQuery = function(queryString, migemo) {
    if(queryString == currentQueryString) {
      return $.Deferred().resolve(queryCache);
    }

    return parseQuery(queryString, migemo).done(function(query) {
      queryCache = query;
      currentQueryString = queryString;
      result = [];
      searchOffset = 0;
    });
  };

  self.execute = function(queryString, migemo, limit, offset) {
    if(!offset) {
      offset = 0;
    }
    return $.when(Pinboard.posts(), getQuery(queryString, migemo)).pipe(function(posts, query) {
      var post;
      var slice;
      var highlight;

      var matcher = function(p) {
        var str = [ p.description, p.tags, p.extended ].join(' ');
        return query.every(function(e) { return str.match(e); });
      };

      while(searchOffset < posts.length) {
        post = posts[searchOffset];
        searchOffset += 1;

        if(matcher(post)) {
          result.push(post);
          if(limit && result.length >= offset + limit) {
            break;
          }
        }
      }

      slice = limit ? result.slice(offset, offset + limit) : result;
      if(slice.length === 0) {
        return $.Deferred().reject();
      }

      highlight = new RegExp(query.map(function(word) {
        return word.source;
      }).join('|'), 'ig');

      return $.Deferred().resolve(slice, highlight);
    });
  };
};

(function() {
  chrome.extension.onConnect.addListener(function(port) {
    var search = new Search();

    port.onMessage.addListener(function(message) {
      var query = message.query;
      var limit = message.limit;
      var offset = message.offset;
      Pinboard.get([ 'enable_migemo' ]).pipe(function(data) {
        return search.execute(query, data.enable_migemo, limit, offset);
      }).done(function(result, highlight) {
        port.postMessage({
          result: result,
          highlight: highlight
        });
      }).fail(function() {
        port.postMessage({
          result: []
        });
      });
    });
  });
})();
