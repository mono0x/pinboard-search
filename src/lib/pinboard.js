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
Pinboard.UPDATE_INTERVAL = 30;

Pinboard.Uris = {};

Pinboard.Uris.postsUpdate = function(params) {
  return 'https://api.pinboard.in/v1/posts/update?' + Utils.buildQuery(params);
};

Pinboard.Uris.postsAll = function(params) {
  return 'https://api.pinboard.in/v1/posts/all?' + Utils.buildQuery(params);
};

Pinboard.initialize = function(onsuccess) {
  Pinboard.storage.get('version', function(data) {
    switch(data.version) {
      case Pinboard.VERSION:
        Pinboard.load(onsuccess);
        break;

      case 20120313:
        Pinboard.storage.remove([ 'login' ], function() {
          Pinboard.storage.set({ 'version': Pinboard.VERSION, 'posts': [] }, function() {
            Pinboard.load(onsuccess);
          });
        });
        break;

      default:
        Pinboard.storage.clear(function() {
          Pinboard.storage.set({ 'version': Pinboard.VERSION, 'posts': [] }, function() {
            Pinboard.load(onsuccess);
          });
        });
        break;
    }
  });
};

Pinboard.load = function(onsuccess) {
  Pinboard.posts = [];
  Pinboard.storage.get('posts', function(data) {
    Pinboard.posts = data.posts;
    Pinboard.sortPosts();
    onsuccess();
  });
};

Pinboard.store = function(posts, force) {
  if(posts.length === 0) {
    return;
  }
  if(force) {
    Pinboard.posts = posts;
  }
  else {
    posts.forEach(function(post) { Pinboard.posts.push(post); });
  }
  Pinboard.sortPosts();
  Pinboard.storage.set({
    'version': Pinboard.VERSION,
    'posts': Pinboard.posts
  });
};

Pinboard.loggedIn = function(onloggedin, onnotloggedin) {
  Pinboard.storage.get('login', function(data) {
    if(data && data.login && data.login.token) {
      onloggedin(data.login.token.split(':')[0]);
    }
    else {
      onnotloggedin();
    }
  });
};

Pinboard.update = function(token, onsuccess, onerror, fromDt) {
  if(!fromDt) {
    Pinboard.update(token, onsuccess, onerror);
    return;
  }
  var params = { format: 'json', auth_token: token };
  var request = new XMLHttpRequest();
  request.open('GET', Pinboard.Uris.postsUpdate(params), true);
  request.onreadystatechange = function() {
    if(request.readyState == 4) {
      if(request.status == 200) {
        if(JSON.parse(request.responseText).update_time > fromDt) {
          Pinboard.fetch(token, onsuccess, onerror, fromDt);
        }
        else {
          onsuccess(request.statusText);
        }
      }
      else {
        onerror(request.statusText);
      }
    }
  };
  request.send(null);
};

Pinboard.fetch = function(token, onsuccess, onerror, fromDt) {
  var params = { format: 'json', auth_token: token };
  if(fromDt) {
    params.fromdt = fromDt;
  }
  var request = new XMLHttpRequest();
  request.open('GET', Pinboard.Uris.postsAll(params), true);
  request.onreadystatechange = function() {
    if(request.readyState == 4) {
      if(request.status == 200) {
        Pinboard.store(JSON.parse(request.responseText), !fromDt);
        onsuccess(request.statusText);
      }
      else {
        onerror(request.statusText);
      }
    }
  };
  request.send(null);
};

Pinboard.login = function(token, onsuccess, onerror) {
  Pinboard.update(token,
    function(message) {
      var login = {
        token: token
      };
      Pinboard.storage.set({ 'login': login }, function() {
        Pinboard.requestAutoUpdate(60 * 60 * 1000);
        onsuccess(message);
      });
    },
    onerror);
};

Pinboard.sortPosts = function() {
  Pinboard.posts.sort(function(a, b) {
    if(a.time < b.time) {
      return 1;
    }
    else if(a.time > b.time) {
      return -1;
    }
  return 0;
  });
};

Pinboard.logout = function() {
  Pinboard.storage.clear();
  Pinboard.cancelAutoUpdate();
};

Pinboard.autoUpdate = function(onsuccess, onerror, force) {
  Pinboard.updateTimer = undefined;
  Pinboard.storage.get('login', function(data) {
    if((!data && data.login)) {
      return;
    }
    var fromDt = !force && Pinboard.posts.length >= 1 ? Pinboard.posts[0].time : undefined;
    Pinboard.update(data.login.token,
      function(message) {
        Pinboard.retryCount = 0;
        Pinboard.requestAutoUpdate(Pinboard.UPDATE_DELAY * 60 * 1000);
        if(onsuccess) {
          onsuccess(message);
        }
      },
      function(message) {
        if(Pinboard.retryCount <= 12) {
          Pinboard.retryCount += 1;
        }
        Pinboard.requestAutoUpdate(Pinboard.retryCount * Pinboard.RETRY_DELAY * 60 * 1000);
        if(onerror) {
          onerror(message);
        }
      }, fromDt);
  });
};

Pinboard.forceUpdate = function(onsuccess, onerror) {
  Pinboard.cancelAutoUpdate();
  Pinboard.autoUpdate(onsuccess, onerror, true);
};

Pinboard.loginRequired = function(onloggedin, onnotloggedin) {
  Pinboard.loggedIn(function(user) {
    if(onloggedin) {
      onloggedin(user);
    }
  },
  function() {
    chrome.tabs.create({ url: chrome.extension.getURL('/login.html') });
    if(onnotloggedin) {
      onnotloggedin();
    }
  });
};

Pinboard.requestAutoUpdate = function(time) {
  Pinboard.cancelAutoUpdate();
  Pinboard.updateTimer = setTimeout(Pinboard.autoUpdate, time);
};

Pinboard.cancelAutoUpdate = function() {
  if(Pinboard.updateTimer) {
    clearTimeout(Pinboard.updateTimer);
    Pinboard.updateTimer = undefined;
  }
};

Pinboard.storage = chrome.storage.local;
Pinboard.posts = [];
Pinboard.retryCount = 0;
Pinboard.updateTimer = undefined;

Pinboard.initialize(function() {
  Pinboard.loginRequired(function() {
    Pinboard.updateTimer = setTimeout(function() {
      Pinboard.autoUpdate(undefined, undefined, true);
    }, Pinboard.STARTUP_DELAY * 60 * 1000);
  });
});

