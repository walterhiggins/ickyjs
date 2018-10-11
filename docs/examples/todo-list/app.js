//
// This example application is based on the popular ToDoMVC application.
// It is functionally identically (to the best of my knowledge) to the
// ES6 Vanilla version and uses the same CSS stylesheet and initial markup.
//
(function(exports) {
  "use strict";

  // short-hand for icky functions
  let { gnf, update, map } = icky;

  // short-hand for querySelector - default is document.querySelector
  const qs = (selector, el) =>
    el ? el.querySelector(selector) : document.querySelector(selector);

  // short-hand for subscribing to topics
  const on = (...args) => {
    const callback = args.pop();
    args.forEach(topic => PubSub.subscribe(topic, callback));
  };

  // constants used throughout the rest of the code
  const KEY = {
    ENTER: 13,
    ESCAPE: 27
  };
  // topics used by Model and Controllers
  const TOPIC = {
    ITEMS_LOADED: "todos/itemsLoaded",
    ITEM_CHANGED: "todos/itemChanged",
    ITEM_STATUS_CHANGED: "todos/itemStatusChanged",
    ITEM_REMOVED: "todos/itemRemoved",
    ITEM_ADDED: "todos/itemAdded",
    VISIBILITY_CHANGED: "todos/visibilityChanged",
    BULK_STATUS_CHANGE: "todos/bulkStatusChange"
  };
  const VISIBILITY = {
    ALL: "All",
    ACTIVE: "Active",
    COMPLETED: "Completed"
  };

  // ## Model
  // The Model object is responsible for encapsulating changes to the to-do list.
  // Stored in localStorage's "todos" variable by default.
  function Model(name = "todos") {
    // visibility filter function
    const visible = item => {
      switch (visibility) {
        case VISIBILITY.ALL:
          return true;
        case VISIBILITY.COMPLETED:
          return item.done;
        case VISIBILITY.ACTIVE:
          return !item.done;
      }
    };
    // load app state from localStorage or init if not present.
    let todos = [];
    let visibility = VISIBILITY.ALL;

    let saved = JSON.parse(localStorage.getItem(name));
    if (saved) {
      todos = saved.todos;
    }
    if (saved) {
      visibility = saved.visibility;
    }
    // notify listeners that model is ready
    setTimeout(() => PubSub.publish(TOPIC.ITEMS_LOADED), 0);

    // model is saved to localStorage - save() is private to the model.
    const save = () => {
      localStorage.setItem(name, JSON.stringify({ todos, visibility }));
    };

    // Model's public functions
    return {
      // toggle the status (done) of a to-do item
      // works for both single items and arrays of items.
      toggle: todo => {
        if (todo.constructor == Array) {
          // if it's an array then send a single notification to listeners
          todo.map(item => (item.done = !item.done));
          save();
          PubSub.publish(TOPIC.BULK_STATUS_CHANGE, todo);
        } else {
          const old = { ...todo };
          todo.done = !todo.done;
          save();
          PubSub.publish(TOPIC.ITEM_STATUS_CHANGED, { o: old, n: todo });
        }
      },
      // change the text for a to-do item
      setText: (todo, text) => {
        const old = { ...todo };
        todo.text = text;
        save();
        PubSub.publish(TOPIC.ITEM_CHANGED, { o: old, n: todo });
      },
      // add a new to-do item
      add: todo => {
        let result = todos.push(todo);
        save();
        PubSub.publish(TOPIC.ITEM_ADDED, result);
      },
      // remove a to-do item
      remove: todo => {
        todos.splice(todos.indexOf(todo), 1);
        save();
        PubSub.publish(TOPIC.ITEM_REMOVED, todo);
      },
      // change the application's visibility option (All, Active or Completed)
      visibility: v => {
        if (v) {
          visibility = v;
          save();
          PubSub.publish(TOPIC.VISIBILITY_CHANGED);
        } else {
          return visibility;
        }
      },
      // get a list of visible items
      visible: () => todos.filter(visible),
      // get a list of remaining items
      remaining: () => todos.filter(item => !item.done),
      // get a list of completed items
      completed: () => todos.filter(item => item.done),
      // get a list of all items
      all: () => [...todos]
    };
  }
  // declare model variable used throughout rest of code.
  let model = null;

  // ## Components
  // The to-do list application is composed of distinct components which need
  // to be updated when the user interacts with the app. These components are:
  //
  // 1. The input field for adding new to-do items
  // 2. The list of to-do items each of which have
  //    2.1 A Checkbox to mark the item as completed (this can be toggled on and off)
  //    2.2 A Button to remove the item (appears on hover)
  //    2.3 A Label with the text which when double-clicked becomes an editable input field.
  // 3. A Checkbox to mark ALL items as completed or Active.
  // 4. A Label showing a count of completed items.
  // 5. A List of hyperlinks in the footer which will show either All, Active or Completed items.
  // 6. A Button to Remove all completed items (which only appears if there are >1 completed items)
  //
  //  Many components are constructed by invoking a function which returns a string of HTML.
  //  Constructing strings of HTML is now easier in ES6 thanks to Template Literals.
  //

  // ### Component: Todo List
  const tTodoList = () => {
    //  The todo list can potentially create a lot of DOM elements each with many event handlers.
    //  When using the gnf() function to allocate global names to the event-handler functions, the
    //  functions are referenced from the global window.icky.namespaces.functions object.
    //  To avoid memory leaks construct a new dedicated namespace and naming function which will
    //  be torn-down and reconstructed whenever this function is called.
    let namer = gnf("tTodoList");
    // tTodoList doesn't have any markup itself, it just repeatedly calls tTodoItem.
    return map(model.visible(), item => tTodoItem(namer, item));
  };
  // when any of these messages are received, update the to-do list
  on(
    TOPIC.ITEMS_LOADED,
    TOPIC.BULK_STATUS_CHANGE,
    TOPIC.ITEM_STATUS_CHANGED,
    TOPIC.ITEM_REMOVED,
    TOPIC.ITEM_ADDED,
    TOPIC.VISIBILITY_CHANGED,
    () => update("ul.todo-list", tTodoList)
  );

  // ### Component: Todo Item.
  // The App's most interactive component. Using this component users can:
  // 1. Toggle the item's status (Completed/Active).
  // 2. Change the item's text
  // 3. Remove the item (by changing the text to an empty string)
  // 4. Remove the item by clicking the Remove button.
  function tTodoItem(nf, todo) {
    // #### Controller code for tTodoItem
    let label, input, listItem;
    let isCanceled = false;
    // trigger a blur event if the user presses Enter
    const doneOnEnter = nf(input => {
      if (event.keyCode == KEY.ENTER) input.blur();
    });
    // trigger a blur event if the user presses Esc
    const cancelOnEsc = nf(input => {
      if (event.keyCode == KEY.ESCAPE) {
        isCanceled = true;
        input.blur();
      }
    });
    // update model if user didn't press Esc
    const maybeUpdate = nf(input => {
      listItem.classList.remove("editing");
      if (isCanceled) return;
      var value = input.value.trim();
      if (value.length) {
        // change to-do item's text if length > 0
        model.setText(todo, value);
        label.innerText = value;
      } else {
        // otherwise remove the item (text is '')
        model.remove(todo);
      }
    });
    // go into editing mode when user double-clicks label
    const edit = nf(pLabel => {
      label = pLabel;
      listItem = label.parentElement.parentElement;
      // CSS is used to hide the label and show the input
      listItem.classList.add("editing");
      input = qs("input.edit", listItem);
      input.focus();
    });
    // #### View for tTodoItem.
    // Note the use of ES6 Template Literals.
    return `
    <li class="${todo.done ? "completed" : ""}">
      <div class="view">
        <input class="toggle" type="checkbox" ${todo.done ? "checked" : ""} 
               onchange="${nf(() => model.toggle(todo))}()" />

        <label ondblclick="${edit}(this)">${todo.text}</label>

        <button class="destroy"
                onclick="${nf(() => model.remove(todo))}()"></button>
      </div>
      <input class="edit"
             onblur="${maybeUpdate}(this)"
             onkeypress="${doneOnEnter}(this)" 
             onkeyup="${cancelOnEsc}(this)"
             value="${todo.text}"/>
    </li>`;
  }

  // ### Component: Items remaining
  const tItemsLeft = () => `${model.remaining().length} Items Left`;
  on(
    TOPIC.ITEMS_LOADED,
    TOPIC.BULK_STATUS_CHANGE,
    TOPIC.ITEM_STATUS_CHANGED,
    TOPIC.ITEM_REMOVED,
    TOPIC.ITEM_ADDED,
    () => update(".todo-count", tItemsLeft)
  );

  // ### Component: Clear Completed button
  const tClearCompleted = () => {
    var completed = model.completed();
    if (completed.length > 0) {
      let onClick = gnf(() => {
        completed.forEach(model.remove);
      });
      return `
      <button class="clear-completed" 
              onclick="${onClick}()">Clear completed</a>`;
    } else {
      return ``;
    }
  };
  on(
    TOPIC.ITEMS_LOADED,
    TOPIC.BULK_STATUS_CHANGE,
    TOPIC.ITEM_STATUS_CHANGED,
    TOPIC.ITEM_REMOVED,
    () => update("#clearCompleted", tClearCompleted)
  );

  // ### Component: Filter links.
  const tFilterList = () => `
    ${tFilterItem("#/", VISIBILITY.ALL)}
    ${tFilterItem("#/active", VISIBILITY.ACTIVE)}
    ${tFilterItem("#/completed", VISIBILITY.COMPLETED)}
  `;
  // ### Component: Filter link
  const tFilterItem = (href, type) => `
  <li>
    <a href="${href}"
       class="${model.visibility() == type ? "selected" : ""}">${type}</a>
  </li>`;
  on(TOPIC.ITEMS_LOADED, TOPIC.VISIBILITY_CHANGED, () => {
    update("ul.filters", tFilterList);
  });

  // ### Component: Toggle-All checkbox
  const toggleAll = qs("input.toggle-all");
  toggleAll.onchange = function() {
    if (this.checked) {
      model.toggle(model.remaining());
    } else {
      model.toggle(model.completed());
    }
  };
  on(
    TOPIC.ITEMS_LOADED,
    TOPIC.ITEM_STATUS_CHANGED,
    TOPIC.ITEM_REMOVED,
    TOPIC.ITEM_ADDED,
    () => {
      toggleAll.checked =
        model.all().length > 0 && model.remaining().length == 0;
    }
  );

  // ### Component: New To-Do input field
  qs("input.new-todo").onchange = function() {
    let text = this.value;
    if (text.trim().length == 0) {
      return;
    }
    model.add({ text: text, done: false });
    this.value = "";
  };

  // ## Routing
  // set up client-side routes for visibility filtering
  const routes = {
    active: () => model.visibility("Active"),
    completed: () => model.visibility("Completed")
  };

  // route based on hash
  const routeByHash = () => {
    let param = location.hash.split("/")[1];
    let action = routes[param] || (() => model.visibility("All"));
    action();
  };
  exports.onhashchange = routeByHash;

  // ## Initialise the App

  // create a new Model object
  model = new Model();
  // update visibility based on location hash
  routeByHash();
})(window);
