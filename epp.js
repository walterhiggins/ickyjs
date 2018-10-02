function load(){
   return JSON.parse(localStorage.getItem('todos'));
}
function save(){
   localStorage.setItem('todos', JSON.stringify(todos));
}
var todos = [];
var uid = 0;
function add(text){
   todos.push({ done: false, text: text , uid: uid++});
  save();
}

function todo(){
  var list = () => `
<ol>
${___(todos, item => `
  <li>${item.text} 
    <input ${item.done?'checked':''} type="checkbox" 
      onchange="${___( done => item.done = done ) }(this.checked)"/>
  </li>
 `)}
</ol>
`;
  return `
<nav>To-Do List</nav>
<div class="wrapper">
  <form onsubmit="${___( (text) => {add(text); ___.update('#main', list)} )}(this.text.value); return false;">
    <input type="text" name="text"/><input type="submit"/>
  </form>
  <div id="main">
    ${list()}
  </div>
</div>
`;
}

window.onload = () => ___.hashchange('#todo');
window.onhashchange = ___.hashchange;
