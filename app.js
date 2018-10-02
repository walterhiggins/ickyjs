
window.onhashchange = ___.hashchange('#todo');

var todos = ['Hello', 'World'];

function todo(){
  return `
<nav>To-Do List</nav>
<ol>
 ${___(todos, todo => `<li>${todo}</li>`)}
</ol>
`
}

window.onload = () => ___.update('#___root', todo);
