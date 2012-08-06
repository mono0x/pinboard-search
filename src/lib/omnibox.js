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

var createSuggest = function(post, highlight) {
  var title = Utils.escapeHtml(post.description).replace(highlight, '<match>$&</match>');
  return {
    content: post.href,
    description: title + ' <url>' + post.href + '</url>'
  };
};

chrome.omnibox.setDefaultSuggestion({
  description: 'Search my posts for <match>%s</match>'
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  if(Pinboard.posts.length === 0) {
    Pinboard.loginRequired();
    return;
  }

  var post, str, highlight, matcher;
  var limit = 5;
  var query = [];
  var offset = 0;

  if(!text.match(/^(.*?)(\.*)$/)) {
    return;
  }

  offset = currentOffset = RegExp.$2.length * limit;
  if(currentQuery != RegExp.$1) {
    currentQuery = RegExp.$1;
    searchResult = [];
    searchOffset = 0;
  }

  query = currentQuery.split(/\s/).map(function(word) {
    return new RegExp(word.replace(/\W/g, '\\$&'), 'ig');
  });
  highlight = new RegExp(currentQuery.split(/\s/).map(function(word) {
    return word.replace(/\W/g, '\\$&');
  }).join('|'), 'ig');

  if(query.length === 0) {
    return;
  }

  if(searchResult.length < offset + limit) {
    matcher = function(q) { return str.match(q); };
    while(searchOffset < Pinboard.posts.length) {
      post = Pinboard.posts[searchOffset];
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

chrome.omnibox.onInputEntered.addListener(function(text) {
  if(text.match(/^https?:\/\//)) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.update(tab.id, { url: text });
    });
  }
  else if(text == currentQuery) {
    if(searchResult.length > currentOffset) {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, { url: searchResult[currentOffset].href });
      });
    }
  }
});

})();
