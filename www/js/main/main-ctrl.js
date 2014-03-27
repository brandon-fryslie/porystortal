(function() {
  var StoryPortal;

  StoryPortal = angular.module('StoryPortal');

  StoryPortal.controller('MainCtrl', function($scope, $ionicGesture, topicRepository) {
    $scope.topics = _(topicRepository.getAllTopics()).shuffle().take(30).value();
    return $scope.pagingFn = function() {
      console.log('paging!');
      $scope.topics = _.shuffle(topicRepository.getAllTopics());
      debugger;
      while ($scope.topics.length < 30) {
        $scope.topics = _.shuffle($scope.topics.concat(topicRepository.getAllTopics()));
      }
      return $scope.$broadcast('scroll.infiniteScrollComplete');
    };
  });

  StoryPortal.directive('storyList', function($ionicGesture) {
    return {
      restrict: 'C',
      link: function($scope, $element, $attrs) {
        return $ionicGesture.on('drag', function(e) {
          return 1;
        }, $element);
      }
    };
  });

}).call(this);

/*
//@ sourceMappingURL=main-ctrl.js.map
*/