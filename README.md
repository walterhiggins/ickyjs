# icky.js - A small icky javascript library

icky.js is a tiny javascript library best used with ES6. It makes no claims for performance, legibility, maintenance, scalability or any of the other good things claimed by best-of-breed javascript libraries and frameworks. Use at your own peril.

## Usage

index.html  

```html
<html>
  <body>
     <div id="ickyroot">
     </div>
  </body>
  <script src="icky.js" type="text/javascript"></script>
  <script src="app.js" type="text/javascript"></script>
</html>
```

app.js

```javascript
(function(exports) {
  var todos = [
    { done: true, text: "Wake Up" }, 
    { done: true, text: "Fall out of Bed" },
    { done: false, text: "Drag a comb across my head" },
  ];

  const todoView = () => `
  <ol>
    ${icky.map(todos, todoItem)}
  </ol>`;

  const todoItem = todo => {
    // an event handler bound to an object
    const onToggleStatus = icky.fname(el => {
      todo.done = el.checked;
    });
    return `
    <li>
      <input type="checkbox" onchange="${onToggleStatus}(this)" ${todo.done ? "checked" : ""} /> 
      ${todo.text}
    </li>`;
  };
  exports.onload = () => icky.update("#ickyroot", todoView);
})(window);
```

## Background

ES6 Template literals make writing HTML in Javascript easier. icky.js provides just 3 functions which help in the construction of HTML using template literals.

### icky.fname()

Given a function reference returns a unique name so the function can be used as an event handler. For example:  

```javascript
var shoppingCart = [];

function removeItemFromCart (item) {
  // ...
}

function btnRemoveItem( item ){
  const onClick = icky.fname( btn => {
    removeItemFromCart( item );
    btn.disabled = true;
  });
  return `<button onclick="${onClick}(this)">Remove</button>`
}
```
This allows bindings between objects and DOM event handlers. Just like Angular's `ng-click`  but without the pain of having to use Angular ;-p
  