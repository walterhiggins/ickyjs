# icky.js - A small icky javascript library

Icky.js is a tiny javascript library best used with ES6. It makes no claims for performance, legibility, maintenance, scalability or any of the other good things claimed by best-of-breed javascript libraries and frameworks. Use at your own peril.

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
  var todos = [{ done: false, text: "Brush Teeth" }, { done: true, text: "Comb Hair" }];
  const todoView = () => `
  <ol>
    ${icky.map(
      todos,
      todo => `
    <li>
      <input type="checkbox" 
             onchange="${icky.fname(done => (todo.done = done))}(this.checked)"
             ${todo.done ? "checked" : ""} /> 
      ${todo.text}
    </li>`
    )}
  </ol>
`;
  exports.onload = () => icky.update("#ickyroot", todoView);
})(window);
```
