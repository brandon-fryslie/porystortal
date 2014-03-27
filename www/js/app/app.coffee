
storyPortalModule = angular.module('StoryPortal', ['ionic', 'sf.virtualScroll']).config ($stateProvider, $urlRouterProvider) ->

  states = [
      name: 'tabs'
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    ,
      name: 'tabs.main'
      url: "/main",
      views:
        'main-tab':
          templateUrl: "templates/main.html",
          controller: 'MainCtrl'
    ,
      name: 'tabs.project'
      url: "/project",
      views:
        'project-tab':
          templateUrl: "templates/project.html"
    ,
      name: 'tabs.help'
      url: "/help",
      views:
        'help-tab':
          templateUrl: "templates/help.html"
  ]

  $stateProvider.state state.name, state for state in states

  $urlRouterProvider.otherwise "/tab/main"