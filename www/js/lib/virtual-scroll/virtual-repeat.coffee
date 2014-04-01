mod = angular.module 'sf.virtualScroll'
DONT_WORK_AS_VIEWPORTS = DONT_WORK_AS_CONTENT = DONT_SET_DISPLAY_BLOCK = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT']

clip = (value, min, max) ->
  if angular.isArray value
    angular.forEach value (v) ->
      clip v, min, max

  Math.max min, Math.min value, max

mod.directive 'sfVirtualRepeat', [ '$log', '$rootElement', '$ionicGesture', ($log, $rootElement, $ionicGesture) ->

  # Turn the expression supplied to the directive:
  #
  #     a in b
  #
  # into `{ value: "a", collection: "b" }`
  parseRepeatExpression = (expression) ->
    match = expression.match /^\s*([\$\w]+)\s+in\s+([\S\s]*)$/
    unless match
      throw new Error "Expected sfVirtualRepeat in form of '_item_ in _collection_' but got '#{expression}'."
    value: match[1]
    collection: match[2]

  isTagNameInList = (element, list) -> _.contains list, element.tagName.toUpperCase()

  # Utility to find the viewport/content elements given the start element:
  findViewportAndContent = (startElement) ->
    root = $rootElement[0]

    # Somewhere between the grandparent and the root node
    e = startElement.parent().parent()[0]

    while e isnt root

      # is element
      break if e.nodeType isnt 1
      # tag isnt in the blacklist
      continue if isTagNameInList e, DONT_WORK_AS_VIEWPORTS
      # has a single child element (the content)
      continue if e.childElementCount isnt 1
      # which is not in the blacklist
      continue if isTagNameInList e.firstElementChild, DONT_WORK_AS_CONTENT
      # and no text

      n = e.firstChild
      while n
        break if n.nodeType isnt 3 and /\S/g.test n.textContent
        n = e.nextSibling

      if n is null
        # That element should work as a viewport.
        return {
          viewport: angular.element e
          content: angular.element e.firstElementChild
        }
      e = e.parentNode

    throw new Error 'No suitable viewport element'

  # Apply explicit height and overflow styles to the viewport element.
  #
  # If the viewport has a max-height (inherited or otherwise), set max-height.
  # Otherwise, set height from the current computed value or use
  # window.innerHeight as a fallback
  #
  setViewportCss = (viewport) ->
    viewportCss =
      overflow: 'auto'
    style = window.getComputedStyle?(viewport[0]) ? viewport[0].currentStyle
    maxHeight = style?.getPropertyValue 'max-height'
    height = style?.getPropertyValue 'height'

    viewportCss.maxHeight = if maxHeight and maxHeight isnt '0px'
        maxHeight
      else if height and height isnt '0px'
        height
      else
        window.innerHeight

    viewport.css viewportCss


  # Apply explicit styles to the content element to prevent pesky padding
  # or borders messing with our calculations:
  setContentCss = (content) -> content.css
    margin: 0
    padding: 0
    border: 0
    'box-sizing': 'border-box'

  # TODO: compute outerHeight (padding + border unless box-sizing is border)
  computeRowHeight = (element) ->
    style = window.getComputedStyle?(element) ? element.currentStyle
    maxHeight = style?.getPropertyValue 'max-height'
    height = style?.getPropertyValue 'height'

    height = if height and height isnt '0px' and height isnt 'auto'
        $log.debug('Row height is "%s" from css height', height);
        height
      else if maxHeight and maxHeight isnt '0px' and maxHeight isnt 'none'
        $log.debug('Row height is "%s" from css max-height', height);
        maxHeight
      else if element.clientHeight
        $log.debug('Row height is "%s" from client height', height);
        element.clientHeight + 'px'
      else
        throw new Error 'Unable to compute height of row'

    angular.element(element).css 'height', height
    parseInt height, 10


  # The compile gathers information about the declaration. There's not much
  # else we could do in the compile step as we need a viewport parent that
  # is exculsively ours - this is only available at link time.
  sfVirtualRepeatCompile = (element, attr, linker) ->
    # console.log 'doing repeat compile', element

    sfVirtualRepeatPostLink = (scope, iterStartElement, attrs) ->

      setElementCss = (element) ->
        elementCss =
          # no margin or it'll screw up the height calculations.
          margin: '0'

        if !isTagNameInList element[0], DONT_SET_DISPLAY_BLOCK
          elementCss.display = 'block'

        if rowHeight
          elementCss.height = rowHeight + 'px'

        element.css elementCss

      makeNewScope = (idx, colExpr, containerScope) ->
        childScope = containerScope.$new()
        collection = containerScope.$eval colExpr

        childScope[ident.value] = collection[idx]
        childScope.$index = idx
        childScope.$first = idx is 0
        childScope.$last = idx is (collection.length - 1)
        childScope.$middle = !(childScope.$first || childScope.$last)
        childScope.$watch ->
          collection = containerScope.$eval colExpr
          childScope[ident.value] = collection[idx]

        childScope

      addElements = (start, end, colExpr, containerScope, insPoint) ->
        frag = document.createDocumentFragment()
        newElements = []
        idx = start
        while idx isnt end
          childScope = makeNewScope idx, colExpr, containerScope
          element = linker childScope, angular.noop
          setElementCss element
          newElements.push element
          frag.appendChild element[0]
          idx++
        insPoint.after frag
        # debugger
        newElements

      # update state variables
      recomputeActive = ->
        # We want to set the start to the low water mark unless the current start is already between the low and high water marks
        start = clip state.firstActive, state.firstVisible - state.lowWater, state.firstVisible - state.highWater
        # Similarly for the end
        end = clip state.firstActive + state.active,
              state.firstVisible + state.visible + state.lowWater,
              state.firstVisible + state.visible + state.highWater
        console.log 'recompute active', start, end, state
        state.firstActive = clip start, 0, state.total - state.visible - state.lowWater
        state.active = Math.min(end, state.total) - state.firstActive


      # On Viewport Scroll
      sfVirtualRepeatOnScroll = (e) ->
        console.log 'repeat on scroll', e

        return unless rowHeight

        # Enter the angular world for the state change to take effect
        scope.$apply ->
          state.firstVisible = Math.floor e.target.scrollTop / rowHeight
          state.visible = Math.ceil dom.viewport[0].clientHeight / rowHeight
          $log.debug 'scroll to row %o', state.firstVisible
          sticky = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight
          recomputeActive()
          $log.debug ' state is now %o', state
          $log.debug ' sticky = %o', sticky

      sfVirtualRepeatWatchExpression = (scope) ->
        coll = scope.$eval ident.collection
        if coll.length isnt state.total
          state.total = coll.length
          recomputeActive()

        console.log 'repeat watch expr', state
        start: state.firstActive
        active: state.active
        len: coll.length

      destroyActiveElements = (action, count) ->
        remover = Array.prototype[action]
        _.times count, ->
          dead = remover.call rendered
          dead.scope().$destroy()
          dead.remove()

      # When the watch expression for the repeat changes, we may need to add
      # and remove scopes and elements
      sfVirtualRepeatListener = (newValue, oldValue, scope) ->
        console.log 'doing repeat listener'
        oldEnd = oldValue.start + oldValue.active
        if newValue is oldValue
          $log.debug 'initial listen'
          newElements = addElements newValue.start, oldEnd, ident.collection, scope, iterStartElement
          rendered = newElements
          if rendered.length
            # debugger
            rowHeight = computeRowHeight newElements[0][0]
            console.log 'rowheight is ', rowHeight
        else
          # debugger
          newEnd = newValue.start + newValue.active
          forward = newValue.start >= oldValue.start
          delta = if forward
              newValue.start - oldValue.start
            else
              oldValue.start - newValue.start
            endDelta = if newEnd >= oldEnd then newEnd - oldEnd else oldEnd - newEnd
            contiguous = delta < if forward then oldValue.active else newValue.active
            $log.debug 'change by %o,%o rows %s', delta, endDelta, if forward then 'forward' else 'backward'

            if !contiguous
              $log.debug 'non-contiguous change'
              destroyActiveElements 'pop', rendered.length
              rendered = addElements newValue.start, newEnd, ident.collection, scope, iterStartElement
            else
              if forward
                $log.debug 'need to remove from the top'
                destroyActiveElements 'shift', delta
              else if delta
                $log.debug 'need to add at the top'
                newElements = addElements(
                  newValue.start,
                  oldValue.start,
                  ident.collection,
                  scope,
                  iterStartElement
                )

                rendered = newElements.concat rendered

              if newEnd < oldEnd
                $log.debug 'need to remove from the bottom'
                destroyActiveElements 'pop', oldEnd - newEnd

              else if endDelta
                lastElement = _.last rendered
                $log.debug 'need to add to the bottom'
                newElements = addElements(
                  oldEnd, newEnd,
                  ident.collection,
                  scope,
                  lastElement
                )

                rendered = rendered.concat newElements

            if !rowHeight and rendered.length
              rowHeight = computeRowHeight rendered[0][0]
            dom.content.css 'padding-top': "#{newValue.start * rowHeight}px"
          dom.content.css 'height': "#{newValue.len * rowHeight}px"
          if sticky
            dom.viewport[0].scrollTop = dom.viewport[0].clientHeight + dom.viewport[0].scrollHeight

      rendered = []
      rowHeight = 0
      sticky = false
      dom = findViewportAndContent(iterStartElement)

      # The list structure is controller by a few simple (visible) variables
      state = if attrs['ngModel']? then scope.$eval(attrs.ngModel) else {}

      # The index of the first active element
      state.firstActive = 0
      # The index of the first visible element
      state.firstVisible = 0
      # The number of elements visible in the viewport
      state.visible = 0
      # Number of active elements
      state.active = 0
      # Total elements
      state.total = 0
      # The point at which we add new elements
      state.lowWater = state.lowWater ? 10
      # The point at which we remove old elements
      state.highWater = state.highWater ? 30
      # (comment in original source) TODO: now watch the water marks

      setContentCss dom.content
      setViewportCss dom.viewport

      # When the user scrolls, we move the state.firstActive

      $ionicGesture.on 'drag', sfVirtualRepeatOnScroll, qwery('ul.story-list')

      # The watch on the collection is just a watch on the length of the collection
      # We don't care if the content changes
      scope.$watch sfVirtualRepeatWatchExpression, sfVirtualRepeatListener, true

      # debugger

      # and that's the link done! all the action is in the handlers...

    ident = parseRepeatExpression attr.sfVirtualRepeat
    return post: sfVirtualRepeatPostLink

  return {
    require: '?ngModel'
    transclude: 'element'
    priority: 1000
    terminal: true
    compile: sfVirtualRepeatCompile
  }

]