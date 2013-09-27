# About Modules

Modules are the "Controllers" in this framework. They handle events
raised by the user from the View (the Document Object Model), and
direct the application flow. They also respond to and publish
application level events.

Modules are self contained boxes on the page responsible for all user
interactions starting from a root element on down in the Document
Object Model. They should be able to live on their own without the
existence of modules outside of their root element, but they may
require sub modules. A task list module might need a selection module
to manage the selecting and unselecting of task list items, for 
example.

## Module Communication

Modules may communicate with one another by using application events.
This gives every module a central conduit for them to publish events,
yet still keep modules decoupled. If no subscribers to the event
exist, then the module can still publish events safely.

On the other hand, modules may subscribe to events without knowing
that the publisher exists, allowing the module to safely subscribe to
an event and wait silently for the publisher to exist.

## Module Programming Conventions

A default class called "Module" is provided by in this framework,
which you can inherit from when creating new module classes.

Example:

    var TaskListModule = Module.extend({
        self: {
            // class or static methods go here
        },
        prototype: {
            // instance methods go here
        }
    });

## Module Interface

Any class that supports the following methods may be used as a module:

- A constructor taking no arguments

        var taskList = new TaskListModule();

- A method called "init" taking two arguments:

  The root element for the module, which may be an HTML element or an
  HTML element Id.

  An optional second argument with option overrides, allowing each
  module instance to be configured at runtime.

        taskList.init("html_tag_id");
        taskList.init("html_tag_id", { title: "Task List" });
        taskList.init(document.getElementById("html_tag_id"));
        taskList.init(document.getElementById("html_tag_id"), { title: "Task List" });

- A method called "destructor" that tears down the module, readying it
  for garbage collection by the browser. By default, the root element
  of the module should be removed from the document, but passing true
  to this method will disassemble the module and keep the root element
  attached to the document.

        taskList.destructor();     // Removes the root element from the document
        taskList.destructor(true); // Keeps the root element in the document

## Module Conventions

- Modules must be instantiable classes

- Module classes must be named in CamelCase, and may be placed in any
  namespace. The class name must end with the word "Module".

  For example, a task list module would be named TaskListModule

- The source code for module classes should live in the "modules"
  folder and be named the same as the class, all lower case with words
  separated by underscores (_).

  For example, the TaskListModule class would live in
  modules/task_list_module.js

- Attempt to make module classes easy to unit test, but having to rely
  on the document object model complicates matters, as does any
  asynchronous interactions via setTimeout, setInterval and Ajax.

- Unit tests for modules should live in the "specs/modules" folder and
  should be named after the class, all lower case, and end with
  "_spec.js".

  For example, unit tests for the TaskListModule class should live in
  specs/modules/task_list_module_spec.js