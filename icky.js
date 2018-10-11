// icky.js
// =======
//
// icky.js is a tiny ES6 library to make writing _simple_ web apps easier.
//
// Its goal is to make writing small prototype webapps easy and fun. The premise of this library
// is based on a couple of assumptions:
//
// * DOM manipulation in Javascript using the DOM API is hard.
// * On the other hand String construction using ES6 Template Literals is easy.
// * Assigning a string to an element's `.innerHTML` property will not open the gates to hell ;-)
//
// If you disagree with any of these assumptions (especially the last one) you should probably not
// use this library.
//
(function(exports) {
  "use strict";
  /* default namespace used for functions is `window.icky.namespaces.functions` */
  const DEFAULT_NAMESPACE = "functions";
  /* each function named via `gnf()` is assigned a unique incremented name */
  let id = 0;
  /* initialise icky */
  let icky = {
    namespaces: {
      [DEFAULT_NAMESPACE]: {}
    }
  };
  /* globallyNameFunction gives the function a name and keeps a reference to it on window.icky */
  const globallyNameFunction = (namespace, fn) => {
    var name = `fn_${id++}`;
    if (icky.namespaces[namespace]) {
      icky.namespaces[namespace][name] = fn;
      return `icky.namespaces.${namespace}.${name}`;
    } else {
      let errMsg = `icky.js error: namespace '${namespace}' does not exist`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  };
  // icky.gnf()
  // ----------
  // app.js
  // ```javascript
  // const cCustomButton = (person) => {
  //   let myClick = icky.gnf((btn) => {
  //     console.log(`You clicked ${person}`);
  //   });
  //   return `
  //   <button onclick="${myClick}(this)">
  //     Welcome {$person}
  //   </button>`;
  // };
  // ```
  icky.gnf = nsFn => {
    /* parameter can be a namespace (string) or a function */
    if (nsFn.constructor == Function) {
      /* if it's a function then name it in the default namespace and return its name... */
      return globallyNameFunction(DEFAULT_NAMESPACE, nsFn);
    } else {
      /* 
        ...otherwise
	1. initialise a new namespace (freeing up memory if it already exists)
	2. return a function which can be used for naming functions in this new namespace
      */
      let namespace = nsFn;
      icky.namespaces[namespace] = {};
      return function(fn) {
        return globallyNameFunction(namespace, fn);
      };
    }
  };

  // icky.map()
  // ----------
  // app.js
  // ```javascript
  // ...
  // let names = ["John","Paul","George","Ringo"];
  // const cCustomButtonList = () => {
  //   return `
  //   <ol>
  //     ${map(names, (name) => `
  //     <li>${cCustomButton(name)}</li>
  //     `)}
  //   </ol>`;
  // };
  // ```
  icky.map = (array, fn) => array.map(fn).join("");
  //
  // icky.update()
  // -------------
  // index.html
  // ```html
  // <html>
  //   <body>
  //     <div id="peopleList"></div>
  //     <script src="icky.js" type="text/javascript"></script>
  //     <script src="app.js" type="text/javascript"></script>
  //   </body>
  // </html>
  // ```
  // app.js
  // ```javascript
  // ...
  // icky.update("#peopleList", cCustomButtonList);
  // ```
  icky.update = (view, fn) => {
    var el = document.querySelector(view);
    if (el) el.innerHTML = fn(el);
    else console.error(`icky.js error: could not find ${view} element`);
  };

  exports.icky = icky;
})(window);
