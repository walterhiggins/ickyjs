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
  (function(exports) {
    const DEFAULT_NAMESPACE = "functions";
    var id = 0;
    exports.namespaces = {};
    exports.namespaces[DEFAULT_NAMESPACE] = {};
    function _globallyNameFunction(namespace, fn) {
      var name = `fn_${id++}`;
      if (exports.namespaces[namespace]) {
        exports.namespaces[namespace][name] = fn;
        return `icky.namespaces.${namespace}.${name}`;
      } else {
        let errMsg = `icky.js error: namespace '${namespace}' does not exist`;
        console.error(errMsg);
        throw new Error(errMsg);
      }
    }
    function globallyNameFunction(namespaceOrFunction) {
      if (namespaceOrFunction.constructor == Function) {
        return _globallyNameFunction(DEFAULT_NAMESPACE, namespaceOrFunction);
      } else {
        let namespace = namespaceOrFunction;
        // initialise namespace (freeing up memory)
        exports.namespaces[namespace] = {};
        return function(fn) {
          return _globallyNameFunction(namespace, fn);
        };
      }
    }
    exports.gnf = globallyNameFunction;
  })(icky);

  //
  // Makes use in template strings nice.
  //
  icky.map = (array, fn) => array.map(fn).join("");
  //
  // given a selector and a function set the element's
  // contents to the function result
  //
  function update(view, fn) {
    var el = document.querySelector(view);
    if (el) el.innerHTML = fn(el);
    else console.error(`icky.js error: could not find ${view} element`);
  }
  icky.update = update;
  exports.icky = icky;
})(window);
