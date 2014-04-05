module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      options: {
        transform: ['brfs'],
        alias: [
          "bower_components/angular/angular.js:angular",
          "bower_components/angular-route/angular-route.js:angular-route"
        ]
      },
      production: {
        src: ['src/js/**/*.js'],
        dest: 'app/js/app.js'
      },
      dev: {
        src: ['src/js/**/*.js'],
        dest: 'app/js/app.js'
      }
    },
    copy: {
      dev: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['./**/*.html', './**/*.css', '!./partials/**/*'],
            dest: 'app/'
          }
        ]
      },
      production: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['./**/*.html', './**/*.css', '!./partials/**/*'],
            dest: 'app/'
          }
        ]
      },
    },
    watch: {
      files: 'src/**/*',
      tasks: ['browserify:dev', 'copy:dev']
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('dev', ['browserify:dev', 'copy:dev', 'watch']);
};
