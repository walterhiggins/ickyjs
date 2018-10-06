# To-Do List MVC

The to-do list example is based on the popular [ToDoMVC][td] project which aims to provide example code for a to-do list implemented in each of the popular frameworks. The todomvc project also includes a [Vanilla ES6 implementation] which runs to approximately 1000 lines of code across many files. In comparison, the _icky.js_ implementation is approximately 200 lines of ES6 code.

This implementation doesn't look exactly like the ToDoMVC implementation but the goal is for it to be _functionally_ identical:

* Add new items to the list
* Remove items from the list
* Remove button only appears on hover.
* Items can be toggled (completed or active).
* A count of remaining items is updated on the fly.
* Items can be filtered by Completed or Active
* In-place editing - Double-click an item to change it.
* The App's visibility state (Active/Completed/All) is directly addressable (can be bookmarked)

The purpose of the ToDoMVC project is to provide example code that exercises each framework. 

[td]: http://todomvc.com/
[van]: https://github.com/tastejs/todomvc/tree/master/examples/vanilla-es6