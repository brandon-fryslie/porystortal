module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-cordovacli'


  grunt.initConfig
    clean:
      coffee:
        src: ['app.js', 'www/js/app/*.js{,.map}']
      plugins: ['plugins']
      platforms: ['platforms']
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
    cordovacli:
      options: path: './'
      add_platforms:
        options:
          command: 'platform'
          action: 'add'
          platforms: ['ios', 'android']
      add_plugins:
        options:
          command: 'plugin'
          action: 'add'
          plugins: [
            'device'
          ]
      build_ios:
        options:
          command: 'build'
          platforms: ['ios']
      build_android:
        options:
          command: 'build'
          platforms: ['android']
      prepare_ios:
        options:
          command: 'prepare'
          platforms: ['ios']
      prepare_android:
        options:
          command: 'prepare'
          platforms: ['android']
    mkdir:
      cordova:
        options:
          create: ['plugins', 'platforms']

  grunt.registerTask 'init', ['mkdir:cordova', 'cordovacli:add_platforms', 'cordovacli:add_plugins']

  grunt.registerTask 'dev', [ 'watch' ]
  grunt.registerTask 'update', ['cordovacli:build_ios', 'cordovacli:build_android']
  grunt.registerTask 'build', ['cordovacli:prepare_ios', 'cordovacli:prepare_android']

  # Only recompile changed coffee files
  changedFiles = Object.create null

  onChange = grunt.util._.debounce ->
    grunt.config 'coffee.all.src', grunt.util._.map(Object.keys(changedFiles), (filepath) -> filepath.replace('rui/test/coffeescripts/', ''))
    changedFiles = Object.create null
  , 200

  grunt.event.on 'watch', (action, filepath) ->
    changedFiles[filepath] = action
    onChange()
