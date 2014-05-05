module.exports = function(grunt) {

  var files = grunt.file.readJSON('build/files.json');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      main: {
        src: files.main,
        dest: 'dist/<%= pkg.name %>.concat.js'
      },
      pollyfill_yepnope: {
        src: files.pollyfill.yepnope,
        dest: 'dist/<%= pkg.name %>_pollyfill_yepnope.concat.js'
      }
    },
    min: {
      main: {
        src: 'dist/<%= pkg.name %>.concat.js',
        dest: 'dist/<%= pkg.name %>.min.js',
      },
      pollyfill_yepnope: {
        src: 'dist/<%= pkg.name %>_pollyfill_yepnope.concat.js',
        dest: 'dist/<%= pkg.name %>_pollyfill_yepnope.min.js',
      }
    }
  });

  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "min" task.
  grunt.loadNpmTasks('grunt-yui-compressor');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'min']);

};