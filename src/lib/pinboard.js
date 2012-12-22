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

var Pinboard = (function() {

var VERSION = 20120812;
var POSTS_STORE = 'Posts';

var STARTUP_DELAY = 5;
var RETRY_DELAY = 5;
var UPDATE_INTERVAL = 10;

var set = function(objects) {
  var deferred = $.Deferred();
  storage.set(objects, function() {
    deferred.resolve();
  });
  return deferred.promise();
};

var get = function(keys) {
  var deferred = $.Deferred();
  storage.get(keys, function(data) {
    deferred.resolve(data);
  });
  return deferred.promise();
};

var remove = function(keys) {
  var deferred = $.Deferred();
  storage.remove(keys, function() {
    deferred.resolve();
  });
  return deferred.promise();
};

var clear = function() {
  var deferred = $.Deferred();
  storage.clear(function() {
    deferred.resolve();
  });
  return deferred.promise();
};

var initialize = function() {
  return get('version').pipe(function(data) {
    switch(data.version) {
      case VERSION:
        return load();

      default:
        return clear().pipe(function() {
          return set({ 'version': VERSION, 'posts': [] });
        }).pipe(function() {
          return load();
        });
    }
  });
};

var load = function() {
  return get('posts').pipe(function(data) {
    return sortPosts(data.posts);
  });
};

var store = function(posts, force) {
  return initialize().pipe(function(base) {
    if(posts.length === 0) {
      return $.Deferred().reject();
    }
    if(!force) {
      base.forEach(function(post) { posts.push(post); });
    }
    return set({
      'version': VERSION,
      'posts': sortPosts(posts)
    });
  });
};

var loggedIn = function() {
  return get('login').pipe(function(data) {
    if(data && data.login && data.login.token) {
      return data.login.token.split(':')[0];
    }
    else {
      return $.Deferred().reject();
    }
  });
};

var update = function(token, fromDt) {
  if(!fromDt) {
    return fetch(token);
  }
  var params = { format: 'json', auth_token: token };
  return $.get('https://api.pinboard.in/v1/posts/update', params).pipe(function(result, statusText) {
    if(JSON.parse(result).update_time > fromDt) {
      return fetch(token, fromDt);
    }
    return statusText;
  });
};

var fetch = function(token, fromDt) {
  var params = { format: 'json', auth_token: token };
  if(fromDt) {
    params.fromdt = fromDt;
  }
  return $.get('https://api.pinboard.in/v1/posts/all', params).pipe(function(result, statusText) {
    var posts = JSON.parse(result);
    return $.when(
      store(posts, !fromDt), set({ 'updated': posts[0].time })
    ).pipe(function() {
      return statusText;
    });
  });
};

var login = function(token) {
  return update(token).pipe(function(message) {
    var login = { token: token };
    return set({ 'version': VERSION, 'login': login }).pipe(function() {
      requestAutoUpdate(UPDATE_INTERVAL);
      return message;
    });
  });
};

var sortPosts = function(posts) {
  posts = posts.filter(function(post) { return !!post; });
  posts.sort(function(a, b) {
    if(a.time < b.time) {
      return 1;
    }
    else if(a.time > b.time) {
      return -1;
    }
    return 0;
  });
  return posts;
};

var logout = function() {
  postsCache = undefined;
  cancelAutoUpdate();
  clear();
};

var autoUpdate = function(force) {
  return get([ 'login', 'updated' ]).pipe(function(data) {
    if((!data && data.login)) {
      return $.Deferred().reject('not logged in');
    }
    return update(data.login.token, !force && data.updated).pipe(function(message) {
      localStorage.retryCount = 0;
      requestAutoUpdate(UPDATE_INTERVAL);
      return message;
    },
    function(message) {
      if(localStorage.retryCount <= 12) {
        localStorage.retryCount += 1;
      }
      requestAutoUpdate(localStorage.retryCount * RETRY_DELAY);
      return message;
    });
  });
};

var forceUpdate = function() {
  return autoUpdate(true);
};

var loginRequired = function() {
  return loggedIn().fail(function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('/login.html') });
  });
};

var requestAutoUpdate = function(time) {
  chrome.alarms.create('update', { delayInMinutes: time });
};

var cancelAutoUpdate = function() {
  chrome.alarms.clearAll();
};

var startup = function() {
  localStorage.retryCount = 0;

  return loginRequired().pipe(function() {
    return autoUpdate(true);
  });
};

var postsCache;
var posts = function() {
  return postsCache || initialize().done(function(p) {
    postsCache = p;
  });
};

var storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(function() {
  startup();
});

chrome.runtime.onStartup.addListener(function() {
  startup();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if(alarm) {
    if(alarm.name == 'update') {
      autoUpdate();
    }
  }
});

return {
  set: set,
  get: get,
  login: login,
  loggedIn: loggedIn,
  loginRequired: loginRequired,
  logout: logout,
  forceUpdate: forceUpdate,
  posts: posts
};

})();
