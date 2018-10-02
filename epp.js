function load(){
   return JSON.parse(localStorage.getItem('todos'));
}
function save(){
   localStorage.setItem(JSON.stringify(todos));
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
<form onsubmit="${__( (text) => {add(text); update('#main', list)} )}(this.text)">
  <input type="text" name="text"/><input type="submit"/>
</form>
<div id="main">
  ${list()}
</div>
`;
}

window.onload = () => ___.hashchange('#todo');
window.onhashchange = ___.hashchange;
