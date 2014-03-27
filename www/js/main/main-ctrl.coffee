StoryPortal = angular.module('StoryPortal')

StoryPortal.controller 'MainCtrl', ($scope, $ionicGesture, topicRepository) ->

  $scope.topics = _(topicRepository.getAllTopics()).shuffle().take(30).value()

  $scope.pagingFn = ->
    console.log 'paging!'

    $scope.topics = _.shuffle topicRepository.getAllTopics()

    debugger

    while $scope.topics.length < 30
      $scope.topics = _.shuffle $scope.topics.concat topicRepository.getAllTopics()

    # $scope.topics = topicRepository.getAllTopics()
    $scope.$broadcast('scroll.infiniteScrollComplete');

StoryPortal.directive 'storyList', ($ionicGesture) ->
  restrict: 'C'
  link: ($scope, $element, $attrs) ->

    $ionicGesture.on 'drag', (e) ->
      1
      # Calculate CSS transforms
    , $element