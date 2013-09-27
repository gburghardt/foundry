# Hypodermic

Hypodermic is a painless dependency injection library for JavaScript. Really.

# Usage

It's easy to start using Hypodermic for dependency injection in your existing
web applications.

## 1) Configure your application dependencies

Use plain old JSON to define how all of your classes are wired together:

    var applicationConfig = {
        config: {
            className: "Object",
            properties: {
                "polling.interval": { value: 1800 },
                "polling.retries": { value: 5 },
                messageLimit: { value: 3 }
            }
        },

        main: {
            className: "Application",
            constructorArgs: [
                { id: "config" }
            ],
            properties: {
                objectFactory: { id: "objectFactory" },
                newsTicker: { id: "newsTicker" }
            }
        },

        transport: {
            className: "XMLHttpRequest"
        }

        newsTicker: {
            className: "News.NewsTickerController",
            constructorArgs: [
                { id: "config" }
            ],
            properties: {
                title: { value: "Latest Headlines" },
                transport: { id: "transport" },
                url: { value: "/latest_news" }
            }
        }
    };

## 2) Write your classes

The classes you write should not be instantiating any of their own dependencies.
If you find yourself writing `this.foo = new Foo()` then you've found a good
candidate for dependency injection. Let Hypodermic do that for you!

### 2.A) Create a main "Application" class

The main application class drives the lifecycle of the whole page.

    function Application(config) {
        this.config = config;
    }

    Application.prototype = {
        config: null,
        element: null,
        objectFactory: null,
        newsTicker: null,

        init: function(element) {
            this.element = element;
            this.newsTicker.init(this.element.querySelector(".news-ticker"));
        },

        setNewsTicker: function(newsTicker) {
            this.newsTicker = newsTicker;
        }
    };

### 2.B) Create your other classes

Break your application down into individual components.

    var News = {};

    News.NewsTickerController = function(config) {
        this.config = config;
    };

    News.NewsTickerController.prototype = {
        config: null,
        element: null,
        method: "GET",
        retries: 0,
        title: "",
        transport: null,
        url: null,
  
        init: function(element) {
            this.element = element;
            this.transport.open(this.url, this.method, true);
            this.getLatestNews();
        },
  
        getLatestNews: function() {
            if (this.retries < this.config["polling.retries"]) {
                this.transport.onreadystatechange = function() {
                    if (this.transport.readyState !== 4 || this.transport.status !== 200) {
                        return;
                    }
        
                    setTimeout(this.getLatestNews.bind(this), this.config["polling.interval"]);
                }.bind(this);
      
              this.transport.send(null);
            }
        }
    };

## 3) Instantiate Hypodermic and use it

Put this in your HTML file:

    <script type="text/javascript">
        var objectFactory = new Hypodermic(applicationConfig);
        var app = objectFactory.getInstance("main");
  
        window.onload = function() {
            app.init(document.body);
        };
    </script>

Now you're up and running!
