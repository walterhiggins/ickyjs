function ___() {
  if (arguments.length == 1) {
    if (arguments[0].constructor == Function) {
      var name = `fn_${___._fns.counter++}`;
      ___._fns[name] = arguments[0];
      return `___._fns.${name}`;
    }
  }
  if (arguments.length == 2) {
    if (
      arguments[0].constructor == Array &&
      arguments[1].constructor == Function
    ) {
      return arguments[0].map(arguments[1]).join("");
    }
  }
}
___._fns = { counter: 0 };
___.hashchange = evt => {
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
  ___.update("#___root", function() {
    return newFn.apply(null, newParts.slice(1).map(decodeURIComponent));
  });
};
___.update = function(view, fn) {
  document.querySelector(view).innerHTML = fn();
};
