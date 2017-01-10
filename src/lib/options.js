$(function() {
  var backgroundPage = function() {
    var deferred = $.Deferred();
    chrome.runtime.getBackgroundPage(deferred.resolve);
    return deferred.promise();
  };

  var updateStatus = function(busy) {
    backgroundPage().pipe(function(background) {
      return background.Pinboard.loggedIn();
    }).then(function(user) {
      $('#status').text('You are logged in as ' + user + '.');
      $('#login').prop('disabled', true);
      $('#logout').prop('disabled', !!busy);
      $('#update').prop('disabled', !!busy);
    },
    function() {
      $('#status').text('You are not logged in.');
      $('#login').prop('disabled', !!busy);
      $('#logout').prop('disabled', true);
      $('#update').prop('disabled', true);
    });
  };
  updateStatus();

  backgroundPage().pipe(function(background) {
    return background.Pinboard.get([ 'enable_migemo' ]);
  }).done(function(data) {
    $('#enable_migemo').prop('checked', data.enable_migemo);
  });

  var m = function(text) {
    $('#message').text(text);
  };

  $('#login').click(function() {
    backgroundPage().done(function(background) {
      background.Pinboard.loginRequired();
    });
    return false;
  });
  $('#update').click(function() {
    backgroundPage().pipe(function(background) {
      m('Updating...');
      updateStatus(true);
      return background.Pinboard.loginRequired().pipe(function() {
        return background.Pinboard.forceUpdate();
      });
    }).then(function(message) {
      updateStatus(false);
      m(message);
    }, function(message) {
      updateStatus(false);
      m(message);
    });
    return false;
  });

  $('#logout').click(function() {
    if(confirm('Do you want to logout?')) {
      backgroundPage().done(function(background) {
        background.Pinboard.logout();
      });
      updateStatus();
    }
    return false;
  });

  $('#enable_migemo').click(function() {
    var checked = $(this).prop('checked');
    backgroundPage().done(function(background) {
      background.Pinboard.set({ 'enable_migemo': checked });
    });
  });
});
