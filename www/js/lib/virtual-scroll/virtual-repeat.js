(function() {
  var DONT_SET_DISPLAY_BLOCK, DONT_WORK_AS_CONTENT, DONT_WORK_AS_VIEWPORTS, clip, mod;

  mod = angular.module('sf.virtualScroll');

  DONT_WORK_AS_VIEWPORTS = DONT_WORK_AS_CONTENT = DONT_SET_DISPLAY_BLOCK = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT'];

  console.log('doing virtual repeat!');

  clip = function(value, min, max) {
    if (angular.isArray(value)) {
      angular.forEach(value(function(v) {
        return clip(v, min, max);
      }));
    }
    return Math.max(min, Math.min(value, max));
  };

  mod.directive('sfVirtualRepeat', [
    '$log', '$rootElement', function($log, $rootElement) {
      var computeRowHeight, findViewportAndContent, isTagNameInList, parseRepeatExpression, setContentCss, setViewportCss, sfVirtualRepeatCompile;
      console.log('linking!');
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
        var e, n, root;
        root = $rootElement[0];
        e = startElement.parent().parent()[0];
        while (e !== root) {
          if (e.nodeType !== 1) {
            break;
          }
          if (isTagNameInList(e, DONT_WORK_AS_VIEWPORTS)) {
            continue;
          }
          if (e.childElementCount !== 1) {
            continue;
          }
          if (isTagNameInList(e.firstElementChild, DONT_WORK_AS_CONTENT)) {
            continue;
          }
          n = e.firstChild;
          while (n) {
            if (n.nodeType !== 3 && /\S/g.test(n.textContent)) {
              break;
            }
            n = e.nextSibling;
          }
          if (n === null) {
            return {
              viewport: angular.element(e),
              content: angular.element(e.firstElementChild)
            };
          }
          e = e.parentNode;
        }
        throw new Error('No suitable viewport element');
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
        var ident, sfVirtualRepeatPostLink;
        console.log('doing repeat compile', element);
        sfVirtualRepeatPostLink = function(scope, iterStartElement, attrs) {
          var addElements, destroyActiveElements, dom, makeNewScope, recomputeActive, rendered, rowHeight, setElementCss, sfVirtualRepeatListener, sfVirtualRepeatOnScroll, sfVirtualRepeatWatchExpression, state, sticky, _ref, _ref1;
          setElementCss = function(element) {
            var elementCss;
            elementCss = {
              margin: '0'
            };
            if (!isTagNameInList(element[0], DONT_SET_DISPLAY_BLOCK)) {
              elementCss.display = 'block';
            }
            if (rowHeight) {
              elementCss.height = rowHeight + 'px';
            }
            return element.css(elementCss);
          };
          makeNewScope = function(idx, colExpr, containerScope) {
            var childScope, collection;
            childScope = containerScope.$new();
            collection = containerScope.$eval(colExpr);
            childScope[ident.value] = collection[idx];
            childScope.$index = idx;
            childScope.$first = idx === 0;
            childScope.$last = idx === (collection.length - 1);
            childScope.$middle = !(childScope.$first || childScope.$last);
            childScope.$watch(function() {
              collection = containerScope.$eval(colExpr);
              return childScope[ident.value] = collection[idx];
            });
            return childScope;
          };
          addElements = function(start, end, colExpr, containerScope, insPoint) {
            var childScope, frag, idx, newElements;
            frag = document.createDocumentFragment();
            newElements = [];
            idx = start;
            while (idx !== end) {
              childScope = makeNewScope(idx, colExpr, containerScope);
              element = linker(childScope, angular.noop);
              setElementCss(element);
              newElements.push(element);
              frag.appendChild(element[0]);
              idx++;
            }
            insPoint.after(frag);
            debugger;
            return newElements;
          };
          recomputeActive = function() {
            var end, start;
            start = clip(state.firstActive, state.firstVisible - state.lowWater, state.firstVisible - state.highWater);
            end = clip(state.firstActive + state.active, state.firstVisible + state.visible + state.lowWater, state.firstVisible + state.visible + state.highWater);
            console.log('recompute active', start, end, state);
            state.firstActive = clip(start, 0, state.total - state.visible - state.lowWater);
            state.active = Math.min(end, state.total) - state.firstActive;
            debugger;
          };
          sfVirtualRepeatOnScroll = function(e) {
            console.log('repeat on scroll', e);
            if (!rowHeight) {
              return;
            }
            return scope.$apply(function() {
              var sticky;
              state.firstVisible = Math.floor(e.target.scrollTop / rowHeight);
              state.visible = Math.ceil(dom.viewport[0].clientHeight / rowHeight);
              $log.debug('scroll to row %o', state.firstVisible);
              sticky = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
              recomputeActive();
              $log.debug(' state is now %o', state);
              return $log.debug(' sticky = %o', sticky);
            });
          };
          sfVirtualRepeatWatchExpression = function(scope) {
            var coll;
            console.log('watch expr', scope);
            coll = scope.$eval(ident.collection);
            if (coll.length !== state.total) {
              state.total = coll.length;
              recomputeActive();
            }
            console.log('repeat watch expr', coll, state);
            return {
              start: state.firstActive,
              active: state.active,
              len: coll.length
            };
          };
          destroyActiveElements = function(action, count) {
            var remover;
            remover = Array.prototype[action];
            return _.times(count, function() {
              var dead;
              dead = remover.call(rendered);
              dead.scope().$destroy();
              return dead.remove();
            });
          };
          sfVirtualRepeatListener = function(newValue, oldValue, scope) {
            var contiguous, delta, endDelta, forward, lastElement, newElements, newEnd, oldEnd, rendered, rowHeight;
            console.log('doing repeat listener');
            oldEnd = oldValue.start + oldValue.active;
            if (newValue === oldValue) {
              $log.debug('initial listen');
              newElements = addElements(newValue.start, oldEnd, ident.collection, scope, iterStartElement);
              rendered = newElements;
              if (rendered.length) {
                return rowHeight = computeRowHeight(newElements[0][0]);
              }
            } else {
              newEnd = newValue.start + newValue.active;
              forward = newValue.start >= oldValue.start;
              delta = forward ? newValue.start - oldValue.start : oldValue.start - newValue.start;
              endDelta = newEnd >= oldEnd ? newEnd - oldEnd : oldEnd - newEnd;
              contiguous = delta < (forward ? oldValue.active : newValue.active);
              $log.debug('change by %o,%o rows %s', delta, endDelta, forward ? 'forward' : 'backward');
              if (!contiguous) {
                $log.debug('non-contiguous change');
                destroyActiveElements('pop', rendered.length);
                rendered = addElements(newValue.start, newEnd, ident.collection, scope, iterStartElement);
              } else {
                if (forward) {
                  $log.debug('need to remove from the top');
                  destroyActiveElements('shift', delta);
                } else if (delta) {
                  $log.debug('need to add at the top');
                  newElements = addElements(newValue.start, oldValue.start, ident.collection, scope, iterStartElement);
                  rendered = newElements.concat(rendered);
                }
                if (newEnd < oldEnd) {
                  $log.debug('need to remove from the bottom');
                  destroyActiveElements('pop', oldEnd - newEnd);
                } else if (endDelta) {
                  lastElement = _.last(rendered);
                  $log.debug('need to add to the bottom');
                  newElements = addElements(oldEnd, newEnd, ident.collection, scope, lastElement);
                  rendered = rendered.concat(newElements);
                }
              }
              if (!rowHeight && rendered.length) {
                rowHeight = computeRowHeight(rendered[0][0]);
              }
              dom.content.css({
                'padding-top': "" + (newValue.start * rowHeight) + "px"
              });
              dom.content.css({
                'height': "" + (newValue.len * rowHeight) + "px"
              });
              if (sticky) {
                return dom.viewport[0].scrollTop = dom.viewport[0].clientHeight + dom.viewport[0].scrollHeight;
              }
            }
          };
          rendered = [];
          rowHeight = 0;
          sticky = false;
          dom = findViewportAndContent(iterStartElement);
          state = attrs['ngModel'] != null ? scope.$eval(attrs.ngModel) : {};
          state.firstActive = 0;
          state.firstVisible = 0;
          state.visible = 0;
          state.active = 0;
          state.total = 0;
          state.lowWater = (_ref = state.lowWater) != null ? _ref : 100;
          state.highWater = (_ref1 = state.highWater) != null ? _ref1 : 300;
          setContentCss(dom.content);
          setViewportCss(dom.viewport);
          dom.viewport.bind('scroll', sfVirtualRepeatOnScroll);
          scope.$watch(sfVirtualRepeatWatchExpression, sfVirtualRepeatListener, true);
          return console.log('did post link', state);
        };
        ident = parseRepeatExpression(attr.sfVirtualRepeat);
        return {
          post: sfVirtualRepeatPostLink
        };
      };
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