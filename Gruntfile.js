module.exports = function(grunt) {

  var files = grunt.file.readJSON('dependencies.json');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      bare: {
        src: files.framework.bare,
        dest: 'dist/<%= pkg.name %>.concat.js'
      },
      "extensions.dojo": {
        src: files.extensions.dojo,
        dest: 'dist/<%= pkg.name %>-extensions-dojo.concat.js'
      },
      "extensions.jquery": {
        src: files.extensions.jquery,
        dest: 'dist/<%= pkg.name %>-extensions-jquery.concat.js'
      },
      "extensions.mootools": {
        src: files.extensions.mootools,
        dest: 'dist/<%= pkg.name %>-extensions-mootools.concat.js'
      },
      "extensions.yui": {
        src: files.extensions.yui,
        dest: 'dist/<%= pkg.name %>-extensions-yui.concat.js'
      },
      "extensions.zepto": {
        src: files.extensions.zepto,
        dest: 'dist/<%= pkg.name %>-extensions-zepto.concat.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      bare: {
        src: files.framework.bare,
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      "extensions.dojo": {
        src: files.extensions.dojo,
        dest: 'dist/<%= pkg.name %>-extensions-dojo.min.js'
      },
      "extensions.jquery": {
        src: files.extensions.jquery,
        dest: 'dist/<%= pkg.name %>-extensions-jquery.min.js'
      },
      "extensions.mootools": {
        src: files.extensions.mootools,
        dest: 'dist/<%= pkg.name %>-extensions-mootools.min.js'
      },
      "extensions.yui": {
        src: files.extensions.yui,
        dest: 'dist/<%= pkg.name %>-extensions-yui.min.js'
      },
      "extensions.zepto": {
        src: files.extensions.zepto,
        dest: 'dist/<%= pkg.name %>-extensions-zepto.min.js'
      }
    }
  });

  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'concat']);

};