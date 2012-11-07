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

$(function() {

  var updateStatus = function(busy) {
    chrome.runtime.getBackgroundPage(function(background) {
      background.Pinboard.loggedIn(function(user) {
        $('#status').text('You are logged in as ' + user + '.');
        $('#login').prop('disabled', true);
        $('#logout').prop('disabled', !!busy);
        $('#update').prop('disabled', !!busy);
      },
      function() {
        $('#status').text('You are not logged in.');
        $('#login').prop('disabled', !!busy);
        $('#logout').prop('disabled', true);
        $('#update').prop('disabled', !!busy);
      });
    });
  };
  updateStatus();

  var m = function(text) {
    $('#message').text(text);
  };

  $('#login').click(function() {
    chrome.runtime.getBackgroundPage(function(background) {
      background.Pinboard.loginRequired();
    });
    return false;
  });
  $('#update').click(function() {
    chrome.runtime.getBackgroundPage(function(background) {
      background.Pinboard.loginRequired(function() {
        m('Updating...');
        updateStatus(true);
        background.Pinboard.forceUpdate(function(message) {
          updateStatus(false);
          m(message);
        },
        function(message) {
          updateStatus(false);
          m(message);
        });
      });
    });
    return false;
  });

  $('#logout').click(function() {
    if(confirm('Do you want to logout?')) {
      chrome.runtime.getBackgroundPage(function(background) {
        background.Pinboard.logout();
      });
      updateStatus();
    }
    return false;
  });
});
