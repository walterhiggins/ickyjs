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

ES6 [Template literals][tl] make writing HTML in Javascript easier. icky.js provides just 3 functions which help in the construction of HTML using template literals.

### icky.fname()

Given a function reference returns a unique name so the function can be used as an event handler. For example:  

```javascript
var shoppingCart = [];
// ...
function removeItemFromCart (item) {
  // ... 
}
// ...
function btnRemoveItem( item ){
  const onClick = icky.fname( btn => {
    removeItemFromCart( item );
    btn.disabled = true;
  });
  return `<button onclick="${onClick}(this)">Remove</button>`
}
```
This allows bindings between objects and DOM event handlers. Just like Angular's `ng-click`  but without the pain of having to use Angular ;-p

For the curious: The function is assigned to a distinct new name in the `window.icky.fname` namespace. In the above example, the generated HTML might look something like this:

```html
<button onclick="icky.fname.fn_15(this)">Remove</button>
```

### icky.map()

Given an Array and a function, `icky.map()` will `map()` over the Array calling the function for each item in the array and then `join()` the array using `""`. Why might this be useful? Consider when using ES6 [template literals][tl] to construct a list of items for display on a page in an ordered list:

```html
<ol>
  <li>Butter</li>
  <li>Eggs</li>
  <li>Salt</li>
</ol>
```

Using ES6 template literals to construct such a list you might write code like this:

```javascript
let shoppingCart = ['Butter','Eggs','Salt'];
//...
const orderedList = (list) => `<ol>${list.map( item => `<li>${item}</li>` )}</ol>
```

...but the results would look something like this:

```html
<ol>
  <li>Butter</li>,
  <li>Eggs</li>,
  <li>Salt</li>
</ol>
```

Each item has a `,` character following it because when an array is converted to a string it is `join()`ed using the default join character (`,`). The `icky.map()` function ensures no extraneous `,` characters will appear in the HTML. So when you rewrite the above function as:

```javascript
const orderedList = (list) => `<ol>${icky.map(list, item => `<li>${item}</li>` )}</ol>
```

...the output will be:

```html
<ol>
  <li>Butter</li>
  <li>Eggs</li>
  <li>Salt</li>
</ol>
```


[tl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals