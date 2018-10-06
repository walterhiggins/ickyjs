// ------------------------------------------------------------------------
// icky.js is a tiny ES6 library to make writing simple web apps easier
// ------------------------------------------------------------------------

(function(exports) {
  "use strict";
  function icky() {
    if (arguments.length == 1) {
      if (arguments[0].constructor == Function) {
        return icky.fname(arguments[0]);
      }
    }
    if (arguments.length == 2) {
      if (
        arguments[0].constructor == Array &&
        arguments[1].constructor == Function
      ) {
        return icky.map(arguments[0], arguments[1]);
      }
      if (
        arguments[0].constructor == String &&
        arguments[1].constructor == Function
      ) {
        return icky.update(arguments[0], arguments[1]);
      }
    }
  }
  //
  // given a function assign it a globally-accessible name
  // so it can be used as an event handler.
  //
  icky.fname = fn => {
    if (icky.fname.counter == undefined) {
      icky.fname.counter = 0;
    }
    var name = `fn_${icky.fname.counter++}`;
    icky.fname[name] = fn;
    return `icky.fname.${name}`;
  };
  //
  // Makes use in template strings nice.
  //
  icky.map = (array, fn) => array.map(fn).join("");
  //
  // given a selector and a function set the element's
  // contents to the function result
  //
  icky.update = function(view, fn) {
    var el = document.querySelector(view);
    if (el) el.innerHTML = fn();
    else console.error(`icky.js error: could not find ${view} element`);
  };
  exports.icky = icky;
})(window);
