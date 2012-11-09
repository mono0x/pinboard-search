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

var Pinboard = {};

Pinboard.VERSION = 20120812;
Pinboard.POSTS_STORE = 'Posts';

Pinboard.STARTUP_DELAY = 5;
Pinboard.RETRY_DELAY = 5;
Pinboard.UPDATE_INTERVAL = 10;

Pinboard.set = function(objects) {
  var deferred = $.Deferred();
  Pinboard.storage.set(objects, function() {
    deferred.resolve();
  });
  return deferred.promise();
};

Pinboard.get = function(keys) {
  var deferred = $.Deferred();
  Pinboard.storage.get(keys, function(data) {
    deferred.resolve(data);
  });
  return deferred.promise();
};

Pinboard.remove = function(keys) {
  var deferred = $.Deferred();
  Pinboard.storage.remove(keys, function() {
    deferred.resolve();
  });
  return deferred.promise();
};

Pinboard.clear = function() {
  var deferred = $.Deferred();
  Pinboard.storage.clear(function() {
    deferred.resolve();
  });
  return deferred.promise();
};

Pinboard.initialize = function() {
  return Pinboard.get('version').pipe(function(data) {
    switch(data.version) {
      case Pinboard.VERSION:
        return Pinboard.load();

      default:
        return Pinboard.clear().pipe(function() {
          return Pinboard.set({ 'version': Pinboard.VERSION, 'posts': [] });
        }).pipe(function() {
          return Pinboard.load();
        });
    }
  });
};

Pinboard.load = function() {
  return Pinboard.get('posts').pipe(function(data) {
    return Pinboard.sortPosts(data.posts);
  });
};

Pinboard.store = function(posts, force) {
  return Pinboard.initialize().pipe(function(base) {
    if(posts.length === 0) {
      return $.Deferred().reject();
    }
    if(!force) {
      base.forEach(function(post) { posts.push(post); });
    }
    return Pinboard.set({
      'version': Pinboard.VERSION,
      'posts': Pinboard.sortPosts(posts)
    });
  });
};

Pinboard.loggedIn = function() {
  return Pinboard.get('login').pipe(function(data) {
    if(data && data.login && data.login.token) {
      return data.login.token.split(':')[0];
    }
    else {
      return $.Deferred().reject();
    }
  });
};

Pinboard.update = function(token, fromDt) {
  if(!fromDt) {
    return Pinboard.fetch(token);
  }
  var params = { format: 'json', auth_token: token };
  return $.get('https://api.pinboard.in/v1/posts/update', params).pipe(function(result, statusText) {
    if(JSON.parse(result).update_time > fromDt) {
      return Pinboard.fetch(token, fromDt);
    }
    return statusText;
  });
};

Pinboard.fetch = function(token, fromDt) {
  var params = { format: 'json', auth_token: token };
  if(fromDt) {
    params.fromdt = fromDt;
  }
  return $.get('https://api.pinboard.in/v1/posts/all', params).pipe(function(result, statusText) {
    var posts = JSON.parse(result);
    return $.when(
      Pinboard.store(posts, !fromDt), Pinboard.set({ 'updated': posts[0].time })
    ).pipe(function() {
      return statusText;
    });
  });
};

Pinboard.login = function(token) {
  return Pinboard.update(token).pipe(function(message) {
    var login = { token: token };
    return Pinboard.set({ 'version': Pinboard.VERSION, 'login': login }).pipe(function() {
      Pinboard.requestAutoUpdate(Pinboard.UPDATE_INTERVAL);
      return message;
    });
  });
};

Pinboard.sortPosts = function(posts) {
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

Pinboard.logout = function() {
  Pinboard.cancelAutoUpdate();
  Pinboard.clear();
};

Pinboard.autoUpdate = function(force) {
  return Pinboard.get([ 'login', 'updated' ]).pipe(function(data) {
    if((!data && data.login)) {
      return $.Deferred().reject('not logged in');
    }
    return Pinboard.update(data.login.token, !force && data.updated).pipe(function(message) {
      localStorage.retryCount = 0;
      Pinboard.requestAutoUpdate(Pinboard.UPDATE_INTERVAL);
      return message;
    },
    function(message) {
      if(localStorage.retryCount <= 12) {
        localStorage.retryCount += 1;
      }
      Pinboard.requestAutoUpdate(localStorage.retryCount * Pinboard.RETRY_DELAY);
      return message;
    });
  });
};

Pinboard.forceUpdate = function() {
  return Pinboard.autoUpdate(true);
};

Pinboard.loginRequired = function() {
  return Pinboard.loggedIn().fail(function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('/login.html') });
  });
};

Pinboard.requestAutoUpdate = function(time) {
  chrome.alarms.create('update', { delayInMinutes: time });
};

Pinboard.cancelAutoUpdate = function() {
  chrome.alarms.clearAll();
};

Pinboard.startup = function() {
  localStorage.retryCount = 0;

  return Pinboard.loginRequired().pipe(function() {
    return Pinboard.autoUpdate(true);
  });
};

Pinboard.storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(function() {
  Pinboard.startup();
});

chrome.runtime.onStartup.addListener(function() {
  Pinboard.startup();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if(alarm) {
    if(alarm.name == 'update') {
      Pinboard.autoUpdate();
    }
  }
});
