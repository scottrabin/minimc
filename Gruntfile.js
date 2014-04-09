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
      font: {
        files: [
          {
            expand: true,
            cwd: './vendor/Font-Awesome/fonts/',
            src: '*',
            dest: 'app/assets/fonts'
          }
        ]
      },
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
    sass: {
      compile: {
        files: {
          "app/css/wexbmc.css": "src/sass/wexbmc.scss"
        }
      }
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
      css: {
        files: 'src/sass/**/*',
        tasks: ['sass']
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
  grunt.loadNpmTasks('grunt-sass');

  grunt.registerTask('dev', ['copy:font', 'copy:dev', 'browserify:dev', 'browserify:devTool', 'sass', 'watch']);
};
