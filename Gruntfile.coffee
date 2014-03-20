module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks "grunt-contrib-clean"

  grunt.initConfig
    clean:
      coffee:
        src: ['app.js', 'www/js/app/*.js{,.map}']
    coffee:
      app:
        expand: true
        cwd: 'www/js'
        src: ['**/*.coffee']
        dest: 'www/js/'
        ext: '.js'
      options:
        sourceMap: true
    watch:
      coffee:
        files: '**/*.coffee'
        tasks: ['coffee']

  grunt.registerTask 'dev', [ 'watch' ]

  # Only recompile changed coffee files
  changedFiles = Object.create null

  onChange = grunt.util._.debounce ->
    grunt.config 'coffee.all.src', grunt.util._.map(Object.keys(changedFiles), (filepath) -> filepath.replace('rui/test/coffeescripts/', ''))
    changedFiles = Object.create null
  , 200

  grunt.event.on 'watch', (action, filepath) ->
    changedFiles[filepath] = action
    onChange()
