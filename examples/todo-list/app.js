(function(exports) {
  "use strict";

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

  // ------------------------------------------------------------------------
  // Model
  // ------------------------------------------------------------------------
  function Model(name = "todos") {
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

    let { todos, visibility } = JSON.parse(localStorage.getItem(name)) || {
      todos: [],
      visibility: VISIBILITY_ALL
    };
    setTimeout(() => PubSub.publish(TOPIC.ITEMS_LOADED), 1);

    const save = () => {
      localStorage.setItem(name, JSON.stringify({ todos, visibility }));
    };

    return {
      toggle: todo => {
        const old = { ...todo };
        todo.done = !todo.done;
        save();
        PubSub.publish(TOPIC.ITEM_CHANGED, { o: old, n: todo });
      },
      setText: (todo, text) => {
        const old = { ...todo };
        todo.text = text;
        save();
        PubSub.publish(TOPIC.ITEM_CHANGED, { o: old, n: todo });
      },
      add: todo => {
        let result = todos.push(todo);
        save();
        PubSub.publish(TOPIC.ITEM_ADDED, result);
      },
      remove: todo => {
        todos.splice(todos.indexOf(todo), 1);
        save();
        PubSub.publish(TOPIC.ITEM_REMOVED, todo);
      },
      visibility: v => {
        if (v) {
          visibility = v;
          save();
          PubSub.publish(TOPIC.VISIBILITY_CHANGED);
        } else {
          return visibility;
        }
      },
      visible: () => todos.filter(visible),
      remaining: () => todos.filter(item => !item.done),
      completed: () => todos.filter(item => item.done)
    };
  }

  let model = null;

  // Handle new ToDo addition
  const onNewTodo = icky.fname(input => {
    if (input.value.trim().length == 0) {
      return false;
    }
    model.add({ text: input.value, done: false });
    input.value = "";
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
    <div id="clearCompleted">
      ${tClearCompleted()}
    </div>
  </footer>`;

  // Todo List
  const tTodoList = () => `<ol>${icky.map(model.visible(), tTodoItem)}</ol>`;

  // Todo Item
  function tTodoItem(todo) {
    const onToggleItemStatus = icky.fname(() => model.toggle(todo));
    const onRemove = icky.fname(() => model.remove(todo));
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
      ${tInPlaceEditor(() => todo.text, v => model.setText(todo, v))}
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
  const tItemsLeft = () => `${model.remaining().length} Items Left`;

  const tClearCompleted = () => {
    var completed = model.completed();
    if (completed.length > 0) {
      let onClick = icky.fname(() => {
        completed.forEach(model.remove);
      });
      return `<button onclick="${onClick}()">Clear completed</a>`;
    } else {
      return ``;
    }
  };
  // Filter links
  const tFilterList = () => `
  <ul class="filters">
    ${tFilterItem("#/", VISIBILITY_ALL)}
    ${tFilterItem("#/active", VISIBILITY_ACTIVE)}
    ${tFilterItem("#/completed", VISIBILITY_COMPLETED)}
  </ul>`;

  // Filter link
  const tFilterItem = (href, type) => `
  <li>
    <a href="${href}" 
       class="${model.visibility() == type ? "selected" : ""}" 
       onclick="${onVisibilityChange}('${type}')">${type}</a>
  </li>`;

  // ------------------------------------------------------------------------
  //  update application views when state changes
  // ------------------------------------------------------------------------
  PubSub.subscribe(TOPIC.ITEMS_LOADED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
  });
  PubSub.subscribe(TOPIC.ITEM_CHANGED, (msg, payload) => {
    // only update if status has change not text
    if (payload.o.done != payload.n.done) {
      icky.update("#itemsLeft", tItemsLeft);
      icky.update("#list", tTodoList);
      icky.update("#clearCompleted", tClearCompleted);
    }
  });
  PubSub.subscribe(TOPIC.ITEM_REMOVED, () => {
    icky.update("#itemsLeft", tItemsLeft);
    icky.update("#list", tTodoList);
    icky.update("#clearCompleted", tClearCompleted);
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

  model = new Model();
  const onVisibilityChange = icky.fname(model.visibility);

  icky.update("#ickyroot", tTodoView);

  const routes = {
    active: () => model.visibility("Active"),
    completed: () => model.visibility("Completed")
  };
  let param = location.hash.split("/")[1];
  let action = routes[param];
  if (action) {
    action();
  }
})(window);
