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

jsrender.views.helpers({
  relativeTime: function(datetime) {
    var date = new Date(datetime);
    var diff = new Date() - date;
    var month = [
      "january", "feburaury", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    if(diff > 12 * 7 * 24 * 60 * 60 * 1000) {
      return month[date.getMonth()] + ' ' + date.getFullYear();
    }
    if(diff > 30 * 24 * 60 * 60 * 1000) {
      return Math.floor(diff / 7 / 24 / 60 / 60 / 1000) + ' weeks ago';
    }
    if(diff > 24 * 60 * 60 * 1000) {
      return Math.floor(diff / 24 / 60 / 60 / 1000) + ' days ago';
    }
    if(diff > 60 * 60 * 1000) {
      return Math.floor(diff / 60 / 60 / 1000) + ' hours ago';
    }
    if(diff > 60 * 1000) {
      return Math.floor(diff / 60 / 1000) + ' minutes ago';
    }
    else {
      return Math.floor(diff / 1000) + ' seconds ago';
    }
  }
});

window.onmessage = function(req) {
  var res;
  switch(req.data.action) {
  case 'jsrender':
    jsrender.templates({
      'search-result-item-template': document.getElementById('search-result-item-template').innerHTML
    });
    res = {
      sequence: req.data.sequence,
      html: jsrender.render[req.data.template](req.data.data)
    };
    window.top.postMessage(res, '*');
    break;
  }
};
