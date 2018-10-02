
window.onhashchange = ___.hashchange;

var todos = ['Hello', 'World'];

function todo(){
  return `
<nav>To-Do List</nav>
<ol>
 ${___(todos, todo => `<li>${todo}</li>`)}
</ol>
`
}

window.onload = () => ___.hashchange('#todo');
