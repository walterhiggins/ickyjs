(function(exports) {
  "use strict";

  const qs = (selector, el) =>
    el ? el.querySelector(selector) : document.querySelector(selector);

  const toggleAll = qs("input.toggle-all");

  const ENTER_KEY = 13,
    ESCAPE_KEY = 27;
  const TOPIC = {
    ITEMS_LOADED: "todos/itemsLoaded",
    ITEM_CHANGED: "todos/itemChanged",
    ITEM_REMOVED: "todos/itemRemoved",
    ITEM_ADDED: "todos/itemAdded",
    VISIBILITY_CHANGED: "todos/visibilityChanged",
    BULK_STATUS_CHANGE: "todos/bulkStatusChange"
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
        if (todo.constructor == Array) {
          todo.map(item => (item.done = !item.done));
          save();
          PubSub.publish(TOPIC.BULK_STATUS_CHANGE, todo);
        } else {
          const old = { ...todo };
          todo.done = !todo.done;
          save();
          PubSub.publish(TOPIC.ITEM_CHANGED, { o: old, n: todo });
        }
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
      completed: () => todos.filter(item => item.done),
      all: () => [...todos]
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
    let label, input, listItem;
    const edit = icky.fname(function(pLabel) {
      label = pLabel;
      listItem = label.parentElement.parentElement;
      input = qs("input.edit", listItem);
      listItem.classList.add("editing");
      input.focus();
    });
    const maybeSave = icky.fname(input => {
      if (!input.dataset.iscanceled) {
        var value = input.value.trim();
        if (value.length) {
          model.setText(todo, value);
          label.innerText = value;
        } else {
          model.remove(todo);
        }
      }
      listItem.classList.remove("editing");
    });
    const doneOnEnter = icky.fname(input => {
      if (event.keyCode == ENTER_KEY) input.blur();
    });
    const cancelOnEsc = icky.fname(input => {
      if (event.keyCode == ESCAPE_KEY) {
        input.dataset.iscanceled = true;
        input.blur();
      }
    });

    return `
    <li class="${todo.done ? "completed" : ""}">
      <div class="view">
        <input class="toggle" type="checkbox" ${todo.done ? "checked" : ""} 
               onchange="${onToggleItemStatus}()" />
        <label ondblclick="${edit}(this)">${todo.text}</label>
        <button class="destroy" onclick="${onRemove}()"></button>
      </div>
      <input class="edit"
             onblur="${maybeSave}(this)"
             onkeypress="${doneOnEnter}(this)" 
             onkeyup="${cancelOnEsc}(this)"
             value="${todo.text}"/>
    </li>`;
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
    toggleAll.checked = model.all().length > 0 && model.remaining().length == 0;
  });
  PubSub.subscribe(TOPIC.BULK_STATUS_CHANGE, (msg, payload) => {
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
    icky.update("#clearCompleted", tClearCompleted);
  });
  PubSub.subscribe(TOPIC.ITEM_CHANGED, (msg, payload) => {
    // only update if status has change not text
    if (payload.o.done != payload.n.done) {
      icky.update(".todo-count", tItemsLeft);
      icky.update("ul.todo-list", tTodoList);
      icky.update("#clearCompleted", tClearCompleted);
      toggleAll.checked =
        model.all().length > 0 && model.remaining().length == 0;
    }
  });
  PubSub.subscribe(TOPIC.ITEM_REMOVED, () => {
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
    icky.update("#clearCompleted", tClearCompleted);
    toggleAll.checked = model.all().length > 0 && model.remaining().length == 0;
  });
  PubSub.subscribe(TOPIC.ITEM_ADDED, () => {
    icky.update(".todo-count", tItemsLeft);
    icky.update("ul.todo-list", tTodoList);
    toggleAll.checked = model.all().length > 0 && model.remaining().length == 0;
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
  qs("input.new-todo").onchange = function() {
    let text = this.value;
    if (text.trim().length == 0) {
      return;
    }
    model.add({ text: text, done: false });
    this.value = "";
  };

  toggleAll.onchange = function() {
    if (this.checked) {
      model.toggle(model.remaining());
    } else {
      model.toggle(model.completed());
    }
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
