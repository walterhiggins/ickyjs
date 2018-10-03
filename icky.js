"use strict";
/*
  icky.js - using this _should_ feel 'icky'. It's for rapid prototyping of simple apps.
*/
function icky() {
  if (arguments.length == 1) {
    if (arguments[0].constructor == Function) {
      return icky.fname(arguments[0]);
    }
  }
  if (arguments.length == 2) {
    if (arguments[0].constructor == Array && arguments[1].constructor == Function) {
      return icky.map(arguments[0], arguments[1]);
    }
    if (arguments[0].constructor == String && arguments[1].constructor == Function) {
      return icky.update(arguments[0], arguments[1]);
    }
  }
}
icky.fname = fn => {
  if (icky.fname.counter == undefined) {
    icky.fname.counter = 0;
  }
  var name = `fn_${icky.fname.counter++}`;
  icky.fname[name] = fn;
  return `icky.fname.${name}`;
};
icky.map = (array, fn) => array.map(fn).join("");

icky.hashchange = evt => {
  var newURL = evt && evt.newURL ? new URL(evt.newURL) : location;
  var newParts = newURL.hash.split("/");
  if (newParts.length == 0) {
    return;
  }

  var newFn = window[newParts[0].substring(1)];
  if (!newFn) {
    if (evt.constructor == String) {
      newFn = window[evt.substring(1)];
    }
  }
  icky.update("#ickyroot", function() {
    return newFn.apply(null, newParts.slice(1).map(decodeURIComponent));
  });
};
icky.update = function(view, fn) {
  var el = document.querySelector(view);
  if (el) el.innerHTML = fn();
  else console.error(`icky.js error: could not find ${view} element`);
};
