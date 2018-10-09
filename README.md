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
  let {gnf, update, map} = icky;
  const todoView = () => `
  <ol>
    ${map(todos, todoItem)}
  </ol>`;

  const todoItem = todo => {
    // an event handler bound to an object
    const onToggleStatus = gnf(el => {
      todo.done = el.checked;
    });
    return `
    <li>
      <input type="checkbox" onchange="${onToggleStatus}(this)" ${todo.done ? "checked" : ""} /> 
      ${todo.text}
    </li>`;
  };
  exports.onload = () => update("#ickyroot", todoView);
})(window);
```

## Background

ES6 [Template literals][tl] make writing HTML in Javascript easier. icky.js provides just 3 functions which help in the construction of HTML using template literals.

### icky.gnf()

gnf is short for Globally-Name Function. Given a function as a parameter it returns a unique name so the function can be used as an event handler. For example:  

```javascript
let {gnf} = icky;
var shoppingCart = [];
// ...
function removeItemFromCart (item) {
  // ... 
}
// ...
function btnRemoveItem( item ){
  const onClick = gnf( btn => {
    removeItemFromCart( item );
    btn.disabled = true;
  });
  return `<button onclick="${onClick}(this)">Remove</button>`
}
```
This allows bindings between objects and DOM event handlers. Just like Angular's `ng-click`  but without the pain of having to use Angular ;-p

For the curious: The function is assigned to a distinct new name in the `window.icky.namespaces` namespace. In the above example, the generated HTML might look something like this:

```html
<button onclick="icky.namespaces.fn_15(this)">Remove</button>
```

As you can imagine, this could potentially be a source of memory leaks because the functions (and their closures) are _kept_ around in memory indefinitely while a reference to them exists on the window object. This can be especially problematic if you use `gnf()` on a collection of objects:

```javascript
// setup data
var numbers = [];
for (var i = 0;i < 100; i++){
  numbers.push('Number ' + i);
}

// template for a list of numbers
const tNumberList = () => {
  return `
  <ol>
    ${icky.map(numbers, tNumber)}
  </ol>`;
};

// template for a number 
const tNumber = (number) => {
  
  const onclick = gnf(btn => { 
    // the number is bound to the element's event handlers via a closure 
    console.log(number);
  });

  return `
  <li>
    <button onclick="${onclick}(this)">${number}</button>
  </li>`;
}

// update page
icky.update("#root", tNumberList);
```

If the `#root` element were updated frequently each call to `tNumberList` will generate new closures which will be kept around (not garbage collected).
You can workaround this by specifying a distinct namespace which will be initialized (existing references in the namespace will be wiped out).
You can use the `gnf` function to specify a new namespace and return a function which will populate the namespace. This is best illustrated by example:


```javascript
// setup data
var numbers = [];
for (var i = 0;i < 100; i++){
  numbers.push('Number ' + i);
}

// template for a list of numbers
const tNumberList = () => {
  // construct an initialise a namespace for this component's children
  let nlGnf = gnf('tNumberList');
  return `
  <ol>
    ${icky.map(numbers, (number) => tNumber(nlGnf, number))}
  </ol>`;
};

// template for a number 
const tNumber = (nf, number) => {
  
  const onclick = nf(btn => { 
    // the number is bound to the element's event handlers via a closure 
    console.log(number);
  });

  return `
  <li>
    <button onclick="${onclick}(this)">${number}</button>
  </li>`;
}

// update page
icky.update("#root", tNumberList);
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
// example code - please don't @ me
document.querySelector('body').innerHTML = orderedList(shoppingCart);
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
// example code - please don't @ me
document.querySelector('body').innerHTML = orderedList(shoppingCart);
```

...the output will be:

```html
<ol>
  <li>Butter</li>
  <li>Eggs</li>
  <li>Salt</li>
</ol>
```

### icky.update()

This is probably the _ickiest_ part of icky.js . Given a query selector and a function reference, it will:

1. Try to find a matching element and if it finds one
2. Invoke the provided function which should return a string - a snippet of HTML 
3. Set the element's contents to the HTML returned by the function.

It's not big and it's not clever.


## About the name

The name _Icky_ came to mind as I watched [this video on WebComponents and Polymer][wcp] wherein the presenter talks about setting `innerHTML` as feeling [icky][dic].

## On Frameworks

I'm not a fan of JS Frameworks and think that you can actually get a lot done using plain new ES6. Application code should _look_ like application code. Breaking up your application code to fit the moulds enforced by the Framework-du-jour is not a good long-term bet.

icky.js is not a framework, at <100 lines of code it can barely be called a library. Its small set of functions are meant to shine a light on what's possible with ES6 Template Literals. If you want to see some examples, start by browsing through the [examples][ex] directory.


[tl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
[wcp]: https://www.youtube.com/watch?v=3QLmAm9xtnU
[dic]: https://dictionary.cambridge.org/dictionary/english/icky
[ex]: ../../tree/master/examples