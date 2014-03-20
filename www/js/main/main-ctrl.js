(function() {
  angular.module('StoryPortal').controller('MainCtrl', function($scope, topicRepository) {
    console.log('MainCtrl!!');
    $scope.topics = [];
    while ($scope.topics.length < 30) {
      $scope.topics = $scope.topics.concat(topicRepository.getAllTopics());
    }
    return $scope.pagingFn = function() {
      debugger;
      console.log('paging!');
      $scope.topics = [];
      while ($scope.topics.length < 30) {
        $scope.topics = $scope.topics.concat(topicRepository.getAllTopics());
      }
      return $scope.$broadcast('scroll.infiniteScrollComplete');
    };
  });

}).call(this);

/*
//@ sourceMappingURL=main-ctrl.js.map
*/