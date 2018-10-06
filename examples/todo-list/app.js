(function(exports) {
  "use strict";
  let todos = [];
  const TOPIC = {
    ITEMS_LOADED: "todos/itemsLoaded",
    ITEM_CHANGED: "todos/itemChanged",
    ITEM_REMOVED: "todos/itemRemoved",
    ITEM_ADDED: "todos/itemAdded",
    VISIBILITY_CHANGED: "todos/visibilityChanged"
  };
  const VISIBILITY_ALL = "All",
    VISIBILITY_ACTIVE = "Active",
    VISIBILITY_COMPLETED = "Completed";

  let visibility = VISIBILITY_ALL;
  const visible = item => {
    switch (visibility) {
      case VISIBILITY_ALL:
        return true;
      case VISIBILITY_COMPLETED:
        return item.done;
      case VISIBILITY_ACTIVE:
        return !item.done;
    }
  };

  //handle change in visibility
  function changeVisibility(v) {
    visibility = v;
    PubSub.publish(TOPIC.VISIBILITY_CHANGED);
  }
  // Handle new ToDo addition
  const onNewTodo = icky.fname(input => {
    if (input.value.trim().length == 0) {
      return false;
    }
    let newTodo = todos.push({ text: input.value, done: false });
    input.value = "";
    PubSub.publish(TOPIC.ITEM_ADDED, newTodo);
    return false;
  });

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
      PubSub.publish(TOPIC.ITEM_CHANGED, todo);
    });
    const onRemove = icky.fname(() => {
      todos.splice(todos.indexOf(todo), 1);
      PubSub.publish(TOPIC.ITEM_REMOVED, todo);
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
    ${tFilterItem("#/", VISIBILITY_ALL)}
    ${tFilterItem("#/active", VISIBILITY_ACTIVE)}
    ${tFilterItem("#/completed", VISIBILITY_COMPLETED)}
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
  //  update application views when state changes
  // ------------------------------------------------------------------------
  PubSub.subscribe(TOPIC.ITEMS_LOADED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(TOPIC.ITEM_CHANGED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(TOPIC.ITEM_REMOVED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(TOPIC.ITEM_ADDED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(TOPIC.VISIBILITY_CHANGED, () => {
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
        PubSub.publish(TOPIC.ITEMS_LOADED);
      });
  })();
})(window);
