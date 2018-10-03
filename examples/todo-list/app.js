"use strict";
(function(exports) {
  var todos = [
    { text: "Wake Up", done: true },
    { text: "Get out of Bed", done: true },
    { text: "Comb Hair", done: false },
    { text: "Go Downstairs", done: false }
  ];
  let visibility = "All";
  const visible = item => {
    switch (visibility) {
      case "All":
        return true;
      case "Completed":
        return item.done;
      case "Pending":
        return !item.done;
    }
  };

  /*
    Items left label
   */
  const itemsLeft = () => `
  ${todos.filter(item => !item.done).length} Items Left
  `;

  /*
    Todo Item
  */
  function todoItem(todo) {
    const onChange = el => {
      todo.done = el.checked;
      icky.update("#itemsLeft", itemsLeft);
      icky.update("#list", todoList);
    };
    return `
    <li class="${todo.done ? "completed" : ""}">
      <input type="checkbox"
        ${todo.done ? "checked" : ""} 
        onchange="${icky.fname(onChange)}(this)" />
      <label>${todo.text}</label>
    </li>
      `;
  }

  /*
    Todo List
   */
  const todoList = () => `
  <ol>
  ${icky.map(todos.filter(visible), todoItem)}
  </ol>`;

  /*
    handle new ToDo addition
   */
  const onNewTodo = icky.fname(input => {
    todos.push({ text: input.value, done: false });
    input.value = "";
    icky.update("#list", todoList);
    icky.update("#itemsLeft", itemsLeft);
    return false;
  });

  /*
    handle change in visibility
   */
  const onVisibilityChange = icky.fname(v => {
    visibility = v;
    icky.update("#list", todoList);
  });

  /*
    Complete view
   */
  const todoView = () => `
  <h1>To-Do List</h1>

  <form onsubmit="return ${onNewTodo}(this.todo)">
    <input type="text" placeholder="What needs to be done?" name="todo"/>
    <input type="submit"/>
  </form>

  <div id="list">
    ${todoList()}  
  </div>


  <form onchange="${onVisibilityChange}(this.visible.value)">

    <span id="itemsLeft">${itemsLeft()}</span>

    <input type="radio" name="visible" value="All" checked/>
    <label for="All">All</label>

    <input type="radio" name="visible" value="Pending" />
    <label for="Pending">Active</label>

    <input type="radio" name="visible" value="Completed" />
    <label for="Completed">Completed</label>

  </form>
      `;

  icky.update("#ickyroot", todoView);
})(window);