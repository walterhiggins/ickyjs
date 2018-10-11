# To-Do List MVC

The to-do list example is based on the popular [ToDoMVC][td] project which aims to provide example code for a to-do list implemented in each of the popular frameworks. The todomvc project also includes a [Vanilla ES6 implementation] which runs to approximately 1000 lines of code across many files. In comparison, the _icky.js_ implementation is approximately 300 lines of ES6 code.

This implementation doesn't look exactly like the ToDoMVC implementation but the goal is for it to be _functionally_ identical:

* [x] Add new items to the list
* [x] Remove items from the list
* [x] Remove button only appears on hover.
* [x] Items can be toggled (completed or active).
* [x] A count of remaining items is updated on the fly.
* [x] Items can be filtered by Completed or Active
* [x] In-place editing - Double-click an item to change it.
* [x] The App's visibility state (Active/Completed/All) is directly addressable (can be bookmarked)
* [x] Uses LocalStorage
* [x] _Clear Completed_ available when >0 Completed items
* [x] Bulk complete/uncomplete

The purpose of the ToDoMVC project is to provide example code that exercises each framework. 

[td]: http://todomvc.com/
[van]: https://github.com/tastejs/todomvc/tree/master/examples/vanilla-es6