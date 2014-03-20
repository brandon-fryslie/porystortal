(function() {
  var storyPortalModule;

  storyPortalModule = angular.module('StoryPortal', ['ionic', 'sf.virtualScroll']).config(function($stateProvider, $urlRouterProvider) {
    var state, states, _i, _len;
    states = [
      {
        name: 'tabs',
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
      }, {
        name: 'tabs.main',
        url: "/main",
        views: {
          'main-tab': {
            templateUrl: "templates/main.html",
            controller: 'MainCtrl'
          }
        }
      }, {
        name: 'tabs.project',
        url: "/project",
        views: {
          'project-tab': {
            templateUrl: "templates/project.html"
          }
        }
      }, {
        name: 'tabs.help',
        url: "/help",
        views: {
          'help-tab': {
            templateUrl: "templates/help.html"
          }
        }
      }
    ];
    for (_i = 0, _len = states.length; _i < _len; _i++) {
      state = states[_i];
      $stateProvider.state(state.name, state);
    }
    return $urlRouterProvider.otherwise("/tab/main");
  });

}).call(this);

/*
//@ sourceMappingURL=app.js.map
*/