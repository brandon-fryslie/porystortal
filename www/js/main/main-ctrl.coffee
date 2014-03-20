angular.module('StoryPortal').controller 'MainCtrl', ($scope, topicRepository) ->

  console.log 'MainCtrl!!'

  # make sure at least 30 items in list
  $scope.topics = []
  while $scope.topics.length < 30
    $scope.topics = $scope.topics.concat topicRepository.getAllTopics()


  $scope.pagingFn = ->
    debugger

    console.log 'paging!'

    $scope.topics = []
    while $scope.topics.length < 30
      $scope.topics = $scope.topics.concat topicRepository.getAllTopics()

    # $scope.topics = topicRepository.getAllTopics()
    $scope.$broadcast('scroll.infiniteScrollComplete');
