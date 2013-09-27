## Description

Promise is a simple library allowing you to easily create your own
promise callbacks. This helps you implement the Promise Programming
Pattern in JavaScript.

This incarnation differs from the when().then() syntax proposed by
[Promises/A+](http://promisesaplus.com/). This library assumes you
are dealing with object oriented programming, so all callbacks
are executed with a certain context, setting the value of "this"
in the callback function. Secondly, it encourages the creation of
concrete sub classes. Lastly, it gives you a way to express what
things can go right and what things can go wrong when an 
asynchronous operation is invoked.

## A quick and dirty example

    blogPost.save(this)
    .saved(function(response, xhr) {
      console.log("Saved!");
    })
    .invalid(function(xhr) {
      console.warn("Oops, validation errors. Try again.");
    })
    .failure(function(xhr) {
      console.error("Blam-O! Nothing you can do. The wheel is spinning, but the hamster is dead.");
    })
    .complete(function() {
      console.log("Done!");
    });

Just by looking at this, you can see what codes gets executed and why
it's being invoked. The "saved" callback means you've saved the blog
post successfully. The "invalid" callback means the server didn't blow
up, but maybe you forgot to enter the blog post title and the user can
recover from this. The "failure" callback means something catastrophic
did go wrong, and maybe the user cannot recover from this. Finally,
the "complete" callback always gets called no matter which of the other
callbacks are invoked.

Compare that to:

    blogPost.save()
    .then(
      function() {
        // ...
      },
      function() {
        // ...
      }
    );

Only if you know the Promise/A+ implementation of the Promise Pattern
would you know that the first function is the "success" handler, and
the second function is the "error" handler. But what is the error? Is
the error recoverable by the user? What if I want a function that
gets executed regardless of whether or not it was a success or failure
but I don't want the execution chain to continue? And God forbid you
should want to use the "this" variable in the callbacks.

### Implementing your specific promise

What are you promising? Success or failure? Are there shades of gray?

success: You saved the blog post. Continue on with your life.

invalid: Nothing terrible went wrong. Just correct your mistakes and
resave.

failure: You didn't do anything wrong, and what did go wrong can't be
corrected by you.

complete: Whether success, failure or invalidity, now we are
done with this operation, so perform some cleanup work.

The promise sub class:

    var ResponsePromise = function(promiser, context) {
      Promise.call(this, promiser, context);
      this._createCallbacks("success", "invalid", "failure", "complete");
    };
    ResponsePromise.prototype = new Promise();

Use the promise:

    BlogPost = function() {};
    BlogPost.prototype.save = function(context) {
      var promise = new ResponsePromise(this, context);

      var xhr = new XMLHttpRequest();
      // ...
      xhr.onreadystatechange = function() {
        if (this.readyState !== 4) { return; }

        if (this.status === 200 || this.status === 201) {
          promise.fullfill("success", this)
            .fullfill("complete", this);
        }
        else if (this.status === 422) {
          promise.fullfill("invalid", JSON.parse(this.responseText))
            .fullfill("complete", this);
        }
        else if (this.status >= 400) {
          promise.fullfill("failure", this)
            .fullfill("complete", this);
        }
      };

      xhr.send();

      return promise;
    };

Invoke the promise:

    var BlogPostController = {
      formSubmit: function() {
        var blogPost = new BlogPost();
        blogPost.title = "Testing";

        // save the blog post, which returns a ResponsePromise...
        blogPost.save(this)
        .saved(function(xhr, promiser) {
          this.setInfoMessage("Saved blog post with title " + promiser.title);
          this.hide();
        })
        .invalid(function(errors, promiser) {
          this.setFormErrors("Some input errors occurred saving blog post with title " + promiser.title + ". Please fix them an try again", errors);
          this.focus();
        })
        .failure(function(xhr, promiser) {
          this.setFormErrors("An error occurred saving blog post with title " + promiser.title + ". Please call our help desk.");
          this.focus();
        })
        .complete(function() {
          // clean up work
          blogPost = null;
        });
      },
      focus: function() {
        // ...
      },
      hide: function() {
        this.element.style.display = "none";
      },
      setInfoMessage: function(s) {
        // ...
      },
      setFormErrors: function(message, errors) {
        // ...
      }
    };

Error handling is not an exact science, but this incarnation of the Promise Pattern can help you tame it.