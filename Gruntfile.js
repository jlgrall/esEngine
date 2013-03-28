// Inspired by: http://gruntjs.com/sample-gruntfile

module.exports = function(grunt) {
	"use strict";
	
	// Project configuration:
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		// https://github.com/gruntjs/grunt-contrib-jshint
		jshint: {
			// configure JSHint (documented at http://www.jshint.com/docs/)
			options: {
				node: true,
				globals: {
				}
			},
			config: ['package.json', 'gruntfile.js'],
			src: {
				options: {
				},
				src: [
					'src/utils.js',
					'src/engine.js',
					'src/entities.js',
					'src/components.js',
					'src/systems.js',
					'src/collections.js'
				]
			},
			test: ['test/**/*.js'],
			dev: {
				options: {
					newcap: false
				},
				src: ['<%= concat.src.dest %>']
			}
		},
		// https://github.com/gruntjs/grunt-contrib-nodeunit
		nodeunit: {
			dev: ['test/*_test.js']
		},
		// https://github.com/gruntjs/grunt-contrib-concat
		concat: {
			src: {
				src: ['src/intro.js', '<%= jshint.src.src %>', 'src/outro.js'],
				dest: 'dist/<%= pkg.config.file_name %>.js'
			}
		},
		// https://github.com/erickrdch/grunt-string-replace
		"string-replace": {
			options: {
				replacements: [
					{
						pattern: /@TITLE/g,
						replacement: '<%= pkg.title %>'
					},
					{
						pattern: /@VERSION/g,
						replacement: '<%= pkg.version %>'
					},
					{
						pattern: /@DATE/g,
						replacement: grunt.template.today("yyyy-mm-dd")
					},
					{
						pattern: /@HOMEPAGE/g,
						replacement: '<%= pkg.homepage %>'
					}
				]
			},
			dev: {
				files: {'<%= concat.src.dest %>': '<%= concat.src.dest %>'}
			},
			min: {
				files: {'<%= uglify.dev.dest %>': '<%= uglify.dev.dest %>'}
			}
		},
		// https://github.com/gruntjs/grunt-contrib-uglify
		uglify: {
			options: {
				banner: '/*! @TITLE v@VERSION @DATE | MIT License */\n'
			},
			dev: {
				src: '<%= concat.src.dest %>',
				dest: 'dist/<%= pkg.config.file_name %>.min.js'
			},
			report: {
				options: {
					report: "gzip"
				},
				src: '<%= concat.src.dest %>',
				dest: 'dist/<%= pkg.config.file_name %>.min.js'
			}
		},
		// https://github.com/treasonx/grunt-markdown
		markdown: {
			options: {
				gfm: true,
				highlight: "manual"/*,
				codeLines: {
					before: '<span>',
					after: '</span>'
				}*/
			},
			meta: {
				files: ['*.md', '!doc/*.md'],
				dest: 'dist/'
			},
			doc: {
				files: ['doc/*.md'],
				dest: 'dist/doc/'
			}	 
		},
		// https://github.com/gruntjs/grunt-contrib-watch
		watch: {
			options: {
				nospawn: false
			},
			config: {
				files: ['<%= jshint.config %>'],
				tasks: ['config']
			},
			meta: {
				files: ['<%= markdown.meta.files %>'],
				tasks: ['meta']
			},
			src: {
				files: ['<%= concat.src.src %>'],
				tasks: ['src']
			},
			doc: {
				files: ['<%= markdown.doc.files %>'],
				tasks: ['doc']
			},
			test: {
				files: ['<%= nodeunit.dev %>'],
				tasks: ['test']
			}
		},
		_clean: {
			dist: ['dist/*']
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-markdown');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	
	grunt.renameTask('clean', '_clean');
	
	// The custom tasks run by typing "grunt taskname" on the command line:
	
	// Use when you are editing the project config files (package.json, gruntfile.js):
	grunt.registerTask('config', ['jshint:config']);
	// Use when you are editing the project meta files (files in the root folder):
	grunt.registerTask('meta', ['markdown:meta']);
	// Use when you are editing the code in src:
	grunt.registerTask('src', ['jshint:src', 'concat:src', 'string-replace:dev', 'jshint:dev', 'nodeunit:dev', 'uglify:dev', 'string-replace:min']);
	// Use when you are editing the doc:
	grunt.registerTask('doc', ['markdown:doc']);
	// Use when you are editing the unit tests:
	grunt.registerTask('test', ['jshint:test', 'nodeunit:dev']);
	
	// To clean up generated files:
	grunt.registerTask('clean', ['_clean:dist']);
	
	// To (re-)build everything:
	grunt.registerTask('build', ['config', 'meta', 'jshint:test', 'src', 'doc']);
	
	// To get a report on the minified sizes (must be built already):
	grunt.registerTask('report', ['uglify:report']);
	
	// To be executed before a commit, checking everything:
	grunt.registerTask('precommit', []);
	
	// The default task can be run just by typing "grunt" on the command line:
	grunt.registerTask('default', ['build']);
	
};