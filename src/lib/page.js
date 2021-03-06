(function() {

var SEARCH_LIMIT = 100;

$(function() {
  var sandbox = (function() {
    var iframe = null;
    var sequence = 0;

    var jsrender = function(template, data) {
      var deferred = $.Deferred();
      var seq = sequence++;
      var messageHandler = function(res) {
        if (res.data.sequence === seq) {
          window.removeEventListener('message', messageHandler);
          deferred.resolve(res.data.html);
        }
      };
      window.addEventListener('message', messageHandler, false);
      iframe.contentWindow.postMessage({
        action: 'jsrender',
        sequence: seq,
        template: template,
        data: data
      }, '*');
      return deferred.promise();
    };

    iframe = document.createElement('iframe');
    iframe.src = 'sandbox.html';
    document.body.appendChild(iframe);

    return {
      jsrender: jsrender
    };
  })();

  var port = chrome.extension.connect();

  var currentQueryString = null;

  var params = Utils.parseQuery();

  var searchHeader = $('#search-header');
  var queryInput = $('#query-input');
  var searchResult = $('#search-result');
  var mainForm = $('#main-form');

  var sequence = 0;
  var trigger = null;

  var searchNext = function(query, offset, seq) {
    var deferred = $.Deferred();
    var messageHandler = function(message) {
      port.onMessage.removeListener(messageHandler);
      if(sequence != seq) {
        deferred.reject();
        return;
      }

      if(message.result.length === 0) {
        if(offset === 0) {
          searchResult.empty();
          deferred.reject();
          return;
        }
        deferred.resolve();
        return;
      }

      sandbox.jsrender('search-result-item-template', message.result).done(function(html) {
        if(offset === 0) {
          searchResult.html(html);
          searchResult.find('.search-result-item:first-child').addClass('search-result-item-active');
        }
        else {
          searchResult.append(html);
        }

        if(message.result.length == SEARCH_LIMIT) {
          trigger = $.Deferred().done(function() {
            searchNext(query, offset + SEARCH_LIMIT, seq);
          });
        }
        else {
          trigger = null;
        }

        deferred.resolve();
      });
    };

    port.postMessage({
      query: query,
      limit: SEARCH_LIMIT,
      offset: offset
    });
    port.onMessage.addListener(messageHandler);

    return deferred.promise();
  };

  var onInput = function() {
    var queryString = queryInput.val();
    if(queryString != currentQueryString) {
      currentQueryString = queryString;

      $(window).off('scroll', onScroll);

      searchNext(queryString, 0, ++sequence).done(function() {
        $(window).scrollTop(0).on('scroll', onScroll);
      });
    }
  };

  var open = function(e) {
    var active = searchResult.find('.search-result-item-active');
    var href;
    if(active.length > 0) {
      href = active.find('.search-result-item-link').attr('href');
      if(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
        window.open(href);
      }
      else {
        location.href = href;
      }
    }
    return false;
  };

  var onKeyDown = function(e) {
    switch(e.which) {
      case 38: // up
        up();
        e.stopPropagation();
        return false;

      case 40: // down
        down();
        e.stopPropagation();
        return false;

      case 13: // Enter
        open(e);
        e.stopPropagation();
        return false;

      default:
        break;
    }
    return true;
  };

  var onScroll = function() {
    var top = $(window).scrollTop();
    var height = searchResult.height();
    if(top > height - 1000) {
      if(trigger) {
        trigger.resolve();
        trigger = null;
      }
    }
  };

  var up = function() {
    var active = searchResult.find('.search-result-item-active');
    var prev = active.prev();
    if(prev.length > 0) {
      active.removeClass('search-result-item-active');
      prev.addClass('search-result-item-active');
      scroll(prev);
    }
  };

  var down = function() {
    var active = searchResult.find('.search-result-item-active');
    var next = active.next();
    if(next.length > 0) {
      active.removeClass('search-result-item-active');
      next.addClass('search-result-item-active');
      scroll(next);
    }
  };

  var scroll = function(element) {
    var top = $(window).scrollTop();
    var bottom = $(window).height() + top;
    var offset = element.offset().top;
    var height = element.outerHeight(true);
    var header = searchHeader.height();

    if(offset - top < header) {
      $(window).scrollTop(offset - header);
    }
    else if(offset - (bottom - height) > header) {
      $(window).scrollTop(top + offset + height - bottom - header);
    }
  };

  var prevScreenX = null;
  var prevScreenY = null;

  var onMouseMove = function(e) {
    var active;
    if(e.screenX != prevScreenX || e.screenY != prevScreenY) {
      prevScreenX = e.screenX;
      prevScreenY = e.screenY;
      active = searchResult.find('.search-result-item-active');
      if(active != this) {
        active.removeClass('search-result-item-active');
        $(this).addClass('search-result-item-active');
      }
    }
  };

  queryInput.on('input', onInput);
  $(document).on('keydown', onKeyDown);
  $(document).on('mousemove', '.search-result-item', onMouseMove);

  if(params.query) {
    queryInput.val(params.query);
    onInput();
  }
});

})();
