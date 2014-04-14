"use strict";

module.exports = function(grunt) {

	grunt.config.requires(['minimc-sass', 'dest']);

	grunt.registerTask('minimc-sass', "Compile MiniMC SCSS source", function() {
		var dest = grunt.config.get([this.name, 'dest']);
		var src = __dirname + '/../sass/wexbmc.scss';
		var files = {};
		files[dest] = src;

		grunt.config.set(['sass', 'compile', 'files'], files);
		grunt.config.set(['copy', this.name, 'files'], [{
			expand: true,
			cwd: __dirname + '/../vendor/Font-Awesome/fonts/',
			src: '*',
			dest: dest + '/../../assets/fonts'
		}]);

		grunt.task.run('sass');
		grunt.task.run('copy:' + this.name);
	});

	grunt.loadNpmTasks('grunt-sass');
};
