module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    "minimc-sass": {
      dest: "app/css/wexbmc.css"
    },
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
            src: 'index.html',
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
      html: {
        files: "src/index.html",
        tasks: "copy:dev"
      },
      js: {
        files: ["src/**/*.js", "src/**/*.html"],
        tasks: ['browserify:dev']
      },
      devtools: {
        files: 'src/dev/**/*',
        tasks: ['browserify:devTool']
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadTasks('vendor/minimc-sass/tasks/');

  grunt.registerTask('dev', ['copy:dev', 'minimc-sass', 'browserify:dev', 'browserify:devTool', 'watch']);
};
