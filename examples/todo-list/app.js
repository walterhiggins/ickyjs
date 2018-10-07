(function(exports) {
  "use strict";

  const ENTER_KEY = 13,
    ESCAPE_KEY = 27;
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

  // ------------------------------------------------------------------------
  // TEMPLATES
  // ------------------------------------------------------------------------

  // Todo List
  const tTodoList = () => icky.map(model.visible(), tTodoItem);

  // Todo Item
  function tTodoItem(todo) {
    const onToggleItemStatus = icky.fname(() => model.toggle(todo));
    const onRemove = icky.fname(() => model.remove(todo));

    return `
    <li class="${todo.done ? "completed" : ""}">
      <div class="view">
        <input class="toggle" type="checkbox" ${todo.done ? "checked" : ""} 
               onchange="${onToggleItemStatus}()" />
        ${tInPlaceEditor(() => todo.text, v => model.setText(todo, v))}  
        <button class="destroy" onclick="${onRemove}()"></button>
      </div>
    </li>
      `;
  }

  // A label which when double-clicked becomes an editable field
  function tInPlaceEditor(getter, setter) {
    const activate = icky.fname(function(label) {
      var listItem = label.parentElement.parentElement;
      listItem.classList.add("editing");
      const input = document.createElement("input");
      input.className = "edit";
      input.value = label.innerText;
      listItem.appendChild(input);
      input.focus();
      function editDone() {
        listItem.removeChild(input);
        listItem.classList.remove("editing");
      }
      input.onblur = function() {
        if (!this.dataset.iscanceled) {
          var value = this.value.trim();
          setter(value);
          label.innerText = value;
          editDone();
        }
      };
      input.onkeypress = function() {
        if (event.keyCode == ENTER_KEY) this.blur();
      };
      input.onkeyup = function() {
        if (event.keyCode === ESCAPE_KEY) {
          this.dataset.iscanceled = true;
          this.blur();
          editDone();
        }
      };
    });
    return `<label ondblclick="${activate}(this)">${getter()}</label>`;
  }

  // Items remaining
  const tItemsLeft = () => `${model.remaining().length} Items Left`;

  const tClearCompleted = () => {
    var completed = model.completed();
    if (completed.length > 0) {
      let onClick = icky.fname(() => {
        completed.forEach(model.remove);
      });
      return `<button class="clear-completed" onclick="${onClick}()">Clear completed</a>`;
    } else {
      return ``;
    }
  };
  // Filter links
  const tFilterList = () => `
    ${tFilterItem("#/", VISIBILITY_ALL)}
    ${tFilterItem("#/active", VISIBILITY_ACTIVE)}
    ${tFilterItem("#/completed", VISIBILITY_COMPLETED)}
  `;

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
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
    icky.update("ul.filters", tFilterList);
    icky.update("#clearCompleted", tClearCompleted);
  });
  PubSub.subscribe(TOPIC.ITEM_CHANGED, (msg, payload) => {
    // only update if status has change not text
    if (payload.o.done != payload.n.done) {
      icky.update(".todo-count", tItemsLeft);
      icky.update("ul.todo-list", tTodoList);
      icky.update("#clearCompleted", tClearCompleted);
    }
  });
  PubSub.subscribe(TOPIC.ITEM_REMOVED, () => {
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
    icky.update("#clearCompleted", tClearCompleted);
  });
  PubSub.subscribe(TOPIC.ITEM_ADDED, () => {
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
  });
  PubSub.subscribe(TOPIC.VISIBILITY_CHANGED, () => {
    icky.update("ul.filters", tFilterList);
    icky.update("ul.todo-list", tTodoList);
  });

  // ------------------------------------------------------------------------
  // Initialise App
  // ------------------------------------------------------------------------

  model = new Model();
  const onVisibilityChange = icky.fname(model.visibility);
  // Handle new ToDo addition
  document.querySelector("input.new-todo").onchange = function() {
    let text = this.value;
    if (text.trim().length == 0) {
      return;
    }
    model.add({ text: text, done: false });
    this.value = "";
  };

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
