(function() {
  var DONT_SET_DISPLAY_BLOCK, DONT_WORK_AS_CONTENT, DONT_WORK_AS_VIEWPORTS, clip, computeRowHeight, findViewportAndContent, isTagNameInList, mod, parseRepeatExpression, setContentCss, setViewportCss, sfVirtualRepeatCompile;

  mod = angular.module('sf.virtualScroll');

  DONT_WORK_AS_VIEWPORTS = DONT_WORK_AS_CONTENT = DONT_SET_DISPLAY_BLOCK = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT'];

  clip = function(value, min, max) {
    if (angular.isArray(value)) {
      angular.forEach(value(function(v) {
        return clip(v, min, max);
      }));
    }
    return Math.max(min, Math.min(value, max));
  };

  parseRepeatExpression = function(expression) {
    var match;
    match = expression.match(/^\s*([\$\w]+)\s+in\s+([\S\s]*)$/);
    if (!match) {
      throw new Error("Expected sfVirtualRepeat in form of '_item_ in _collection_' but got '" + expression + "'.");
    }
    return {
      value: match[1],
      collection: match[2]
    };
  };

  isTagNameInList = function(element, list) {
    return _.contains(list, element.tagName.toUpperCase());
  };

  findViewportAndContent = function(startElement) {
    var e, root;
    root = $rootElement[0];
    return e = startElement.parent().parent()[0];
  };

  setViewportCss = function(viewport) {
    var height, maxHeight, style, viewportCss, _ref;
    viewportCss = {
      overflow: 'auto'
    };
    style = (_ref = typeof window.getComputedStyle === "function" ? window.getComputedStyle(viewport[0]) : void 0) != null ? _ref : viewport[0].currentStyle;
    maxHeight = style != null ? style.getPropertyValue('max-height') : void 0;
    height = style != null ? style.getPropertyValue('height') : void 0;
    viewportCss.maxHeight = maxHeight && maxHeight !== '0px' ? maxHeight : height && height !== '0px' ? height : window.innerHeight;
    return viewport.css(viewportCss);
  };

  setContentCss = function(content) {
    var contentCss;
    contentCss = {
      margin: 0,
      padding: 0,
      border: 0,
      'box-sizing': 'border-box'
    };
    return content.css(contentCss);
  };

  computeRowHeight = function(element) {
    var height, maxHeight, style, _ref;
    style = (_ref = typeof window.getComputedStyle === "function" ? window.getComputedStyle(element) : void 0) != null ? _ref : element.currentStyle;
    maxHeight = style != null ? style.getPropertyValue('max-height') : void 0;
    height = style != null ? style.getPropertyValue('height') : void 0;
    height = (function() {
      if (height && height !== '0px' && height !== 'auto') {
        return $log.debug('Row height is "%s" from css height', height);
      } else if (maxHeight && maxHeight !== '0px' && maxHeight !== 'none') {
        $log.debug('Row height is "%s" from css max-height', height);
        return maxHeight;
      } else if (element.clientHeight) {
        $log.debug('Row height is "%s" from client height', height);
        return element.clientHeight + 'px';
      } else {
        throw new Error('Unable to compute height of row');
      }
    })();
    angular.element(element).css('height', height);
    return parseInt(height, 10);
  };

  sfVirtualRepeatCompile = function(element, attr, linker) {
    var ident;
    ident = parseRepeatExpression(attr.sfVirtualRepeat);
    return {
      post: sfVirtualRepeatPostLink
    };
  };

  mod.directive('sfVirtualRepeat', [
    '$log', '$rootElement', function($log, $rootElement) {
      return {
        require: '?ngModel',
        transclude: 'element',
        priority: 1000,
        terminal: true,
        compile: sfVirtualRepeatCompile
      };
    }
  ]);

}).call(this);

/*
//@ sourceMappingURL=virtual-repeat.js.map
*/