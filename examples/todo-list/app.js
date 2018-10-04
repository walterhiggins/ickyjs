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
      case "Active":
        return !item.done;
    }
  };

  /*
    Items left label
   */
  const itemsLeft = () =>
    `${todos.filter(item => !item.done).length} Items Left`;
  /*
    A label which when double-clicked becomes an editable field
   */
  function inPlaceEditor(getter, setter) {
    const activate = icky.fname(function(label) {
      var container = label.parentElement;
      var oldValue = label.innerText;
      // Turn text input back into a label
      const deactivate = () => (container.innerHTML = textLabel());
      const save = input => {
        setter(input.value);
        deactivate();
      };
      const keydown = input => {
        let action = {
          /* TAB */ "9": save,
          /* ENT */ "13": save,
          /* ESC */ "27": deactivate
        }[window.event.keyCode];
        action ? action(input) : null;
      };
      container.innerHTML = `
      <input type="text" 
             onblur="${icky.fname(deactivate)}()"
             onkeydown="${icky.fname(keydown)}(this)" 
             value="${oldValue}">`;
    });
    const textLabel = () =>
      `<label ondblclick="${activate}(this)">${getter()}</label>`;
    return `<span>${textLabel()}</span>`;
  }
  /*
    Todo Item
  */
  function todoItem(todo) {
    const onToggleItemStatus = icky.fname(() => {
      todo.done = !todo.done;
      icky.update("#itemsLeft", itemsLeft);
      icky.update("#list", todoList);
    });
    const onRemove = icky.fname(() => {
      todos.splice(todos.indexOf(todo), 1);
      icky.update("#itemsLeft", itemsLeft);
      icky.update("#list", todoList);
    });
    const onMouseOut = icky.fname(el => {
      el.querySelector("button").className = "";
    });
    const onMouseOver = icky.fname(el => {
      el.querySelector("button").className = "visible";
    });

    return `
    <li onmouseout="${onMouseOut}(this)"
        onmouseover="${onMouseOver}(this)" 
        class="${todo.done ? "completed" : ""}">
      <input type="checkbox"
        ${todo.done ? "checked" : ""} 
        onchange="${onToggleItemStatus}()" />
      ${inPlaceEditor(() => todo.text, v => (todo.text = v))}
      <button onclick="${onRemove}()">x</button>
    </li>
      `;
  }

  // Todo List
  const todoList = () =>
    `<ol>${icky.map(todos.filter(visible), todoItem)}</ol>`;

  // Handle new ToDo addition
  const onNewTodo = icky.fname(input => {
    if (input.value.trim().length == 0) {
      return false;
    }
    todos.push({ text: input.value, done: false });
    input.value = "";
    icky.update("#list", todoList);
    icky.update("#itemsLeft", itemsLeft);
    return false;
  });

  /*
    handle change in visibility
  */
  const changeVisibility = v => {
    visibility = v;
    icky.update("#list", todoList);
    icky.update("#filterList", filterList);
  };
  const onVisibilityChange = icky.fname(changeVisibility);

  const filterItem = (href, type) => `
  <li>
    <a href="${href}" 
       class="${visibility == "${type}" ? "selected" : ""}" 
       onclick="${onVisibilityChange}('${type}')">${type}</a>
  </li>`;

  const filterList = () => `
  <ul class="filters">
    ${filterItem("#/", "All")}
    ${filterItem("#/active", "Active")}
    ${filterItem("#/completed", "Completed")}
  </ul>`;

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

  <div id="filterList">
    ${filterList()}
  </div>`;

  icky.update("#ickyroot", todoView);

  var param = location.hash.split("/")[1];
  var action = {
    active: () => changeVisibility("Active"),
    completed: () => changeVisibility("Completed")
  }[param];
  if (action) {
    action();
  }
})(window);
