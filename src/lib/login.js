$(function() {
  var backgroundPage = function() {
    var deferred = $.Deferred();
    chrome.runtime.getBackgroundPage(deferred.resolve);
    return deferred.promise();
  };

  $('form').submit(function() {
    var token = $('input[name="token"]').val();

    if(!token) {
      return false;
    }

    $('input[type="submit"]').prop('disabled', true);
    $('#message').text('Authorizing...');

    backgroundPage().pipe(function(background) {
      return background.Pinboard.login(token);
    }).then(function(message) {
      $('input[type="submit"]').prop('disabled', false);
      $('#message').text(message);
    },
    function(message) {
      $('input[type="submit"]').prop('disabled', false);
      $('#message').text(message);
    });

    return false;
  });
});
