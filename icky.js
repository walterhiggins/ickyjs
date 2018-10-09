// ------------------------------------------------------------------------
// icky.js is a tiny ES6 library to make writing simple web apps easier
// ------------------------------------------------------------------------

(function(exports) {
  "use strict";
  //
  // given a function assign it a globally-accessible name
  // so it can be used as an event handler.
  //
  let icky = {};
  icky.fname = fn => {
    if (icky.fname._counter == undefined) {
      icky.fname._counter = 0;
    }
    if (fn.constructor == Function) {
      var name = `fn_${icky.fname._counter++}`;
      icky.fname[name] = fn;
      return `icky.fname.${name}`;
    } else {
      icky.fname[fn] = {};
      return function(fn2) {
        var name = `fn_${icky.fname._counter++}`;
        icky.fname[fn][name] = fn2;
        return `icky.fname.${fn}.${name}`;
      };
    }
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
