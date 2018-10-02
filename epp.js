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
    ${___(todos, todo => `
    <li>${todo} 
      <input 
        type="checkbox" 
        onchange="${__(
          (done) => {
            todo.done = done; ___.update('#main',list);
          } )}(this.checked)"/>
    </li>
    `)}
  </ol>
`;
  `
<nav>To-Do List</nav>
<div id="main">
  ${list()}
</div>
`;

window.onload = () => ___.hashchange('#todo');
window.onhashchange = ___.hashchange;
