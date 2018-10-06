(function(exports) {
  "use strict";
  let todos = [];
  const topic = {
    ITEMS_LOADED: "todos/itemsLoaded",
    ITEM_CHANGED: "todos/itemChanged",
    ITEM_REMOVED: "todos/itemRemoved",
    ITEM_ADDED: "todos/itemAdded",
    VISIBILITY_CHANGED: "todos/visibilityChanged"
  };

  // ------------------------------------------------------------------------
  // TEMPLATES
  // ------------------------------------------------------------------------

  // Main (top-level) view
  const tTodoView = () => `
  <h1>To-Do List</h1>

  <form onsubmit="return ${onNewTodo}(this.todo)">
    <input type="text" placeholder="What needs to be done?" name="todo"/>
    <input type="submit"/>
  </form>

  <div id="list">
    ${tTodoList()}  
  </div>

  <footer>
    <div id="itemsLeft">
      ${tItemsLeft()}
    </div>
    <div id="filterList">
      ${tFilterList()}
    </div>
  </footer>`;

  // Todo List
  const tTodoList = () =>
    `<ol>${icky.map(todos.filter(visible), tTodoItem)}</ol>`;

  // Todo Item
  function tTodoItem(todo) {
    const onToggleItemStatus = icky.fname(() => {
      todo.done = !todo.done;
      PubSub.publish(topic.ITEM_CHANGED, todo);
    });
    const onRemove = icky.fname(() => {
      todos.splice(todos.indexOf(todo), 1);
      PubSub.publish(topic.ITEM_REMOVED, todo);
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
      ${tInPlaceEditor(() => todo.text, v => (todo.text = v))}
      <button onclick="${onRemove}()">x</button>
    </li>
      `;
  }

  // A label which when double-clicked becomes an editable field
  function tInPlaceEditor(getter, setter) {
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

  // Items remaining
  const tItemsLeft = () =>
    `${todos.filter(item => !item.done).length} Items Left`;

  // Filter links
  const tFilterList = () => `
  <ul class="filters">
    ${tFilterItem("#/", "All")}
    ${tFilterItem("#/active", "Active")}
    ${tFilterItem("#/completed", "Completed")}
  </ul>`;

  const onVisibilityChange = icky.fname(changeVisibility);

  // Filter link
  const tFilterItem = (href, type) => `
  <li>
    <a href="${href}" 
       class="${visibility == type ? "selected" : ""}" 
       onclick="${onVisibilityChange}('${type}')">${type}</a>
  </li>`;

  // ------------------------------------------------------------------------
  // Application Logic
  // ------------------------------------------------------------------------

  // Handle new ToDo addition
  const onNewTodo = icky.fname(input => {
    if (input.value.trim().length == 0) {
      return false;
    }
    let newTodo = todos.push({ text: input.value, done: false });
    input.value = "";
    PubSub.publish(topic.ITEM_ADDED, newTodo);
    return false;
  });

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

  //handle change in visibility
  function changeVisibility(v) {
    visibility = v;
    PubSub.publish(topic.VISIBILITY_CHANGED);
  }

  // ------------------------------------------------------------------------
  //  update application views when state changes
  // ------------------------------------------------------------------------
  PubSub.subscribe(topic.ITEMS_LOADED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(topic.ITEM_CHANGED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(topic.ITEM_REMOVED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(topic.ITEM_ADDED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(topic.VISIBILITY_CHANGED, () => {
    icky.update("#filterList", tFilterList);
    icky.update("#list", tTodoList);
  });

  // ------------------------------------------------------------------------
  // Initialise App
  // ------------------------------------------------------------------------

  (function init() {
    icky.update("#ickyroot", tTodoView);

    let param = location.hash.split("/")[1];
    const routes = {
      active: () => changeVisibility("Active"),
      completed: () => changeVisibility("Completed")
    };

    let action = routes[param];
    if (action) {
      action();
    }

    fetch("todos.json")
      .then(response => response.json())
      .then(json => {
        todos = json.todos;
        PubSub.publish(topic.ITEMS_LOADED);
      });
  })();
})(window);
