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
    }
  });

  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['concat']);

};