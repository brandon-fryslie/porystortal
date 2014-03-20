(function() {
  angular.module('StoryPortal').factory('topicRepository', function() {
    return {
      getAllTopics: function() {
        return [
          {
            name: 'I Was So Embarassed'
          }, {
            name: 'A Funeral'
          }, {
            name: 'A Love Story'
          }, {
            name: 'A Miracle'
          }, {
            name: 'A Missed Connection'
          }, {
            name: 'A Star Encounter'
          }, {
            name: 'A Tall Tale'
          }, {
            name: 'A Time I Really Appreciated Men'
          }, {
            name: 'A Time I Really Appreciated Women'
          }, {
            name: 'All In The Family'
          }, {
            name: 'An Unexpected Bodily Function'
          }, {
            name: 'And Then I Got Caught'
          }, {
            name: 'Animals'
          }
        ];
      }
    };
  });

}).call(this);

/*
//@ sourceMappingURL=topicService.js.map
*/