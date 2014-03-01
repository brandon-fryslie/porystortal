module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks "grunt-contrib-clean"

  grunt.initConfig
    clean:
      coffee:
        src: ['js/app']
    coffee:
      app:
        expand: true
        cwd: 'js/app'
        src: ['**/*.coffee']
        ext: '.js'
     options:
       sourceMap: true
    watch:
      coffee:
        files: 'app/**/*.coffee'
        tasks: 'coffee'

  grunt.registerTask 'dev', [ 'watch' ]
