module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      options: {
        transform: ['brfs'],
      },
      production: {
        src: ['src/app.js'],
        dest: 'app/app.js',
        options: {
          alias: [
            "bower_components/angular/angular.js:angular",
            "bower_components/angular-route/angular-route.js:angular-route"
          ]
        }
      },
      dev: {
        src: ['src/app.js'],
        dest: 'app/app.js',
        options: {
          ignore: ['bower_components/angular/angular.js'],
          alias: [
            "bower_components/angular/angular.js:angular",
            "bower_components/angular-route/angular-route.js:angular-route"
          ]
        }
      },
      devTool: {
        src: ['src/dev/tool.js'],
        dest: 'app/devTool.js'
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
      tasks: ['browserify:dev', 'browserify:devTool', 'copy:dev']
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('dev', grunt.config.get('watch.tasks').concat('watch'));
};
