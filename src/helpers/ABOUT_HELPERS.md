# About Helpers

Helpers are utility classes that encompass specific behavior that
multiple classes in your application can use. Examples would be
escaping special characters, serializing objects into JSON, XML or
some other format, date formatting, etc.

There are two types of helpers:

- Object Literal Helpers
- Instantiable Helpers

## Object Literal Helpers

Object literal helpers just contain static methods, which your other
classes must reference using the global scope:

    var NumberFormatHelper = {
        currency: function(n, symbol) {
            symbol = symbol || "$";

            return symbol + Number(n).toFixed(2);
        }
    };

Use this Helper:

    NumberFormatHelper.currency(23.94752907); // returns "$23.95"

## Instantiable Helpers

These helpers are classes that must be instantiated before being used.
This, coupled with dependency injection, is the preferred method for
using helpers because it keeps your code decoupled, making it easier
to test.

    function NumberFormatHelper() {
    }

    NumberFormatHelper.prototype = {
        constructor: NumberFormatHelper,

        currency: function(n, symbol) {
            symbol = symbol || "$";

            return symbol + Number(n).toFixed(2);
        }
    };

Use this helper:

    var helper = new NumberFormatHelper();

    helper.currency(23.94752907); // returns "$23.95"

## Code Conventions

- Both static and class based helpers are acceptable, but the
  preferred method is class based helpers that can be instantiated and
  injected as dependencies to other classes.

- Helpers should be named in camel case format, with "Helper" appended
  as the last word. The files should live in the "helpers" folder, and
  be named all lower case with words separated by underscores (_).

  For example, a helper named NumberFormatHelper would live in
  helpers/number_format_helper.js

- Helpers should be written in a manor allowing them to be unit
  tested. Those tests should go in the spec/helpers folder and named
  the same as the source code for the helper with "_spec.js" appended
  to the file name.

  For example, the tests for NumberFormatHelper would live in
  spec/helpers/number_format_helper_spec.js.