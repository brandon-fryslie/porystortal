
angular.module('todo', ['ionic'])

.controller('TodoCtrl', ($scope) ->
  debugger

  $scope.tasks = [
    { title: 'Collect coins' },
    { title: 'Eat mushrooms' },
    { title: 'Get high enough to grab the flag' },
    { title: 'Find the Princess' }
  ];
)
