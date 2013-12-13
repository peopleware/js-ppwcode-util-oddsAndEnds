define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "ppwcode-util-contracts/_Mixin",
        "dojo/dnd/move", "dijit/focus",
        "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-attr", "dojo/_base/fx", "dojo/fx",
        "../../log/logger!", "module",

        "xstyle/css!./draggablePane.css"],
    function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _ContractMixin,
             move,  focus,
             domClass, domStyle, domConstruct, domGeom, domAttr, baseFx, fx,
             logger, module) {

      // gap: Number
      //   The gap, in pixels, to visualize between neighbouring instances.
      //   To be applied left.
      var gap = 12; // px

      // extraGapForFocused: Number
      //   The extra gap, in pixels, to visualize between neighbouring instances when the pane is focused.
      //   To be applied left and right.
      var extraGapForFocused = 40; // px

      // dropPositionGap: Number
      //   During a drag, the position where the dragged pane would be positioned when the mouse is released
      //   "now", is represented by this extra gap.
      var dropPositionGap = 75; // px

      var moveAnimationDuration = 500;
      var dragAnimationDuration = 100;

      var _AbstractDraggablePane = declare([_ContractMixin], {
        // summary:
        //   Supertype for DraggablePane and left and right sentinels.
        // description:
        //   DraggablePanes exposes an interface to the HorizontalPanesContainer and peer instances, not to be used by others,
        //   by which they behave as elements in a double-linked-list with sentinels at both ends.
        //   During the drag of a pane, it is removed from the double-linked-list, and inserted again on drop.
        //
        //   This type is explicitly not Stateful (or a _WidgetBase). External users should not be concerned
        //   with the instance variables.
        //
        //   Since there is only 1 mouse, in any application, there can only be 1 Pane "on the move".
        //   "Move" animations however could play concurrently in more than 1 instance of HorizontalPanesContainer.
        //   They cannot be stored "statically".

        invars: [
          function() {return !this.isInList() || this.container;}
        ],

        // container: HorizontalPanesContainer?
        //   The container this is in. This is also "in" the container while it is being dragged.
        //   This property does not send events.
        container: null,

        isIn: function(/*HorizontalPanesContainer*/ hpc) {
          return this.container === hpc;
        },

        isInList: function() {
          // summary:
          //   This instance is in a list.

          this._c_ABSTRACT();
        },

        getIndexInContainer: function() {
          // summary:
          //  The index of this in the container, if it is not a sentinel.
          //  Undefined for sentinels.
          this._c_pre(function() {return this.container;});

          return this._c_ABSTRACT();
        },

        getFirst: function() {
          // summary:
          //   Find the first element in the double-linked-list.
          this._c_pre(function() {return this.container;});

          return this.container && this.container._leftSentinel;
        },

        getLast: function() {
          // summary:
          //   Find the last element in the double-linked-list.
          this._c_pre(function() {return this.container;});

          return this.container && this.container._rightSentinel;
        },

        findVisualizationOf: function(object) {
          // summary:
          //   Returns an element from this list this is in,
          //   that represents `object`, or returns undefined if
          //   there is no such object in the list.
          this._c_pre(function() {return this.isInList();});

          return this._c_ABSTRACT(object); // return DraggablePane | undefined
        },

        _focusChanged: function(oldFocusStack, newFocusStack) {
          // summary:
          //   Who is the left-most draggable that gained or lost focus in the list? Call from left sentinel.
          // description:
          //   Returns the first pane from the left that gained or lost focus, which might be undefined.
          this._c_pre(function() {return pane.isInList();});

          return this._c_ABSTRACT(oldFocusStack, newFocusStack);
        },

        _isAfter: function(/*Number*/ referencePosition) {
          // summary:
          //   This is after `referencePosition` currently (i.e., independent from the target position).
          this._c_pre(function() {return this.isInList();});

          return this._c_ABSTRACT(referencePosition);
        },

        _repositionFromHereToRightAnimations: function(/*Number?*/ referencePosition) {
          // summary:
          //   Animations to reposition the widgets to be placed horizontally next to each other, for this
          //   and all panes to the right.
          // referencePosition: Number
          //   Optional X-coordinate where the center of dragged pane is. This is where
          //   the pane on the move would be dropped. Some visual indication should be given.
          // description:
          //   Returns an array of Animations to do the dance, which might be empty.
          this._c_pre(function() {return this.isInList();});

          return this._c_ABSTRACT(referencePosition);
        },

        reposition: function(/*Number?*/ referencePosition) {
          // summary:
          //   Repositions the widgets to be placed horizontally next to each other
          // referencePosition: Number
          //   Optional X-coordinate where the center of dragged pane is. This is where
          //   the pane on the move would be dropped. Some visual indication should be given.
          // description:
          //   Starting with "this" widget it will position itself and loop further through all his
          //   "next" widgets to position themselves.
          this._c_pre(function() {return this.isInList();});

          var self = this;
          if (self.container._repositionAnimations) {
            self.container._repositionAnimations.stop(true);
          }
          self.container._repositionAnimations = fx.combine(self._repositionFromHereToRightAnimations(referencePosition));
          self.container._repositionAnimations.onEnd = function() {
            self.container._repositionAnimations = null;
          };
          self.container._repositionAnimations.play();
        }

      });

      var _HasNext = declare([_AbstractDraggablePane], {

        invars: [
          function() {return !this.isInList() || this.next;},
          function() {return !this.isInList() || this.next.isInList();},
          function() {return !this.isInList() || 0 <= this._getTargetRightPosition();},
          function() {return !this.isInList() || this._getTargetRightPosition() <= this.next._getTargetRightPosition();}
        ],

        // next: _HasPrevious
        //   The next DraggablePane in the HorizontalPanesContainer we are in.
        //   Not null if container is not null. Consider this read-only.
        next: null,

        _getTargetRightPosition: function(/*Number?*/ referencePosition) {
          // summary:
          //   Returns the right x-coordinate of the widget
          // referencePosition: Number
          //   Optional X-coordinate where the center of dragged pane is. This is where
          //   the pane on the move would be dropped. Some visual indication should be given.
          // description:
          //   The right position of the widget is the left position + its width, with an extra if this is focused.
          this._c_pre(function() {return this.isInList();});

          return this._c_ABSTRACT(referencePosition);
        }

      });

      var LeftSentinel = declare([_HasNext], {

        invars: [
          function() {return this.isInList() === !!this.next;}
        ],

        constructor: function(container) {
          this.container = container;
        },

        findVisualizationOf: function(object) {
          return this.next.findVisualizationOf(object);
        },

        isInList: function() {
          return !!this.next;
        },

        getIndexInContainer: function() {
          return undefined;
        },

        _focusChanged: function(oldFocusStack, newFocusStack) {
          return this.next._focusChanged(oldFocusStack, newFocusStack);
        },

        _isAfter: function() {
          return false;
        },

        _getTargetRightPosition: function() {
          return 0;
        },

        _repositionFromHereToRightAnimations: function(/*Number?*/ referencePosition) {
          return this.next._repositionFromHereToRightAnimations(referencePosition);
        }

      });

      var _HasPrevious = declare([_AbstractDraggablePane], {

        invars: [
          function() {return !this.isInList() || this.previous;},
          function() {return !this.isInList() || this.previous.isInList();},
          function() {return !this.isInList() || 0 <= this._getTargetLeftPosition();},
          function() {return !this.isInList() || this.previous._getTargetLeftPosition() <= this._getTargetLeftPosition();}
        ],

        // previous: _HasNext
        //   The previous DraggablePane in the HorizontalPanesContainer we are in.
        //   Not null if container is not null. Consider this read-only.
        previous: null,

        _getTargetLeftPosition: function(/*Number?*/ referencePosition) {
          // summary:
          //   Returns the left x-coordinate of the widget if it is in the double-linked-list of
          //   a HorizontalPanesContainer. If a drag is active, this takes into account the drop-gap.
          // referencePosition: Number
          //   Optional X-coordinate where the center of dragged pane is. This is where
          //   the pane on the move would be dropped. Some visual indication should be given.
          // description:
          //   Will loop through all the previous widgets in the linked list to determine it's left position.
          //   The left position is the right position of the previous widget + the gap in between the widgets.
          this._c_pre(function() {return this.isInList();});

          var leftPos = this.previous._getTargetRightPosition(referencePosition) + gap;
          if ((referencePosition || referencePosition === 0) && this._isAfter(referencePosition) && !this.previous._isAfter(referencePosition)) {
            leftPos += dropPositionGap;
          }
          return leftPos;
        },

        _getLastBeforeMouseAndThis: function(/*Number*/ referencePosition) {
          // summary:
          //   The last pane in the list, whose center is before the mouse.
          //   We start from the sentinel at the right, and then look from right to left if "we" are before the mouse.
          //   The first that is before, from right to left, is the last from left to right.
          this._c_pre(function() {return this.isInList();});

          return this.previous._isAfter(referencePosition) ? this.previous._getLastBeforeMouseAndThis(referencePosition) : this.previous;
        }

      });

      var RightSentinel = declare([_HasPrevious], {

        invars: [
          function() {return this.isInList() === !!this.previous;}
        ],

        constructor: function(container) {
          this.container = container;
        },

        findVisualizationOf: function() {
          return undefined;
        },

        isInList: function() {
          return !!this.previous;
        },

        getIndexInContainer: function() {
          return undefined;
        },

        _focusChanged: function() {
          return undefined;
        },

        _isAfter: function() {
          return true;
        },

        _repositionFromHereToRightAnimations: function() {
          return [];
        }

      });

      var DraggablePane = declare([_WidgetBase, _HasNext, _HasPrevious], {
        // summary:
        //   A "window" inside a HorizontalPanesContainer.
        //   This type is only concerned with "being and behaving inside a HorizontalPanesContainer".
        //   The only visualization this type offers, is that it presents a pane, with a "bar", by which it
        //   can be dragged. This can be any DOMNode.
        // description:
        //   The width of a DraggablePane is not trivial. Without any explicit setting, the width
        //   would be 0. We do not want to define a width here, because different instances, with different
        //   content, might desire a different width. On the other hand, it makes no sense to display
        //   a DraggablePane without content. Therefor, we want to derive the width from our content.
        //   However, we have to keep in mind that, when the _setContentWidgetAttr is called, the content is
        //   probably not yet in the DOM, and will not yet have a calculated width. You must make sure that,
        //   before you call this method, the contentWidget will have a css width (a definite width, that needs
        //   no calculation in the DOM) that is not 0.
        //
        //   DraggablePanes exposes an interface to the HorizontalPanesContainer and peer instances, not to be used by others,
        //   by which they behave as elements in a double-linked-list with sentinels at both ends.
        //   During the drag of a pane, it is removed from the double-linked-list, and inserted again on drop.

        invars: [
          function() {return this.isInList() === !!this.previous && !!this.next;}
        ],

        // _dragBarNode: DOMNode
        //   DOM Node that is provided in the template to drag the pane by.
        //   This must have a value before the instance is added to a list.
        _dragBarNode: null,

        // _moveable: constrainedMoveable
        //    Note that this can only be created once this is in the DOM!
        _moveable: null,

        // focused: Boolean
        //   Focus injects this.
        focused: false,

        postCreate: function() {
          this.inherited(arguments);
          this.focusNode = this.domNode;
          domClass.add(this.domNode, "draggablePane");
          domAttr.set(this.domNode, "tabindex", 0); // tabindex 0 makes the div focusable, in DOM order
        },

        isInList: function() {
          return !!this.previous && !!this.next;
        },

        _focusChanged: function(oldFocusStack, newFocusStack) {
          if (((!oldFocusStack || oldFocusStack.indexOf(this.id) < 0) && (newFocusStack && newFocusStack.indexOf(this.id) >= 0)) || // had no focus, and now has focus
              ((!oldFocusStack || oldFocusStack.indexOf(this.id) >= 0) && (newFocusStack && newFocusStack.indexOf(this.id) < 0))) { // had focus, and has no longer
            return this;
          }
          else {
            return this.next._focusChanged(oldFocusStack, newFocusStack);
          }
        },

        getIndexInContainer: function() {
          return this.container.getIndexOfChild(this);
        },

        _addToListAfter: function(/*_HasNext*/ pane) {
          // summary:
          //   Adds this in the double-linked list after the given pane.
          //   This method does not reposition or animate.
          this._c_pre(function() {return !this.isInList();});
          this._c_pre(function() {return pane;});
          this._c_pre(function() {return pane.isInList();});

          this.container = pane.container; // pane may not have a get method
          var oldNext = pane.next;
          pane.next = this;
          this.previous = pane;
          this.next = oldNext;
          oldNext.previous = this;
          // also keep it in the correct relative place in the dom
          this.domNode.parentNode.removeChild(this.domNode);
          if (pane.domNode) {
            domConstruct.place(this.domNode, pane.domNode, "after");
          }
          else {
            domConstruct.place(this.domNode, this.container.domNode, "first");
          }
        },

        _removeFromList: function() {
          // summary:
          //   Removes the current pane from the double linked list it is in. `next` and `previous`
          //   are set to null. `container` is not changed. This widget is not destroyed.
          //   This method does not reposition or animate.
          this._c_pre(function() {return this.isInList();});

          var next = this.next;
          this.previous.next = next;
          next.previous = this.previous;
          this.next = null;
          this.previous = null;
        },

        addToContainerAfter: function(/*_HasNext*/ pane) {
          // summary:
          //   Adds this in the double-linked list after the given pane, or last, and adds this
          //   to the DOM.
          //   Then, the necessary elements in the list are repositioned, and this
          //   is given focus.
          this._c_pre(function() {return !this.isInList();});
          this._c_pre(function() {return pane;});
          this._c_pre(function() {return pane.isInList();});

          var self = this;
          var container = pane.container;
          container._onTheMove = this;
          domStyle.set(self.domNode, "opacity", "0");
          container.addChild(this, pane.getIndexInContainer()); // puts it in the DOM; now this has an id
          self.resize();
          //   Defines a limited constrained area where the draggable widgets can move within
          //   Widgets can only move for the width of all the widgets, not further off screen.
          //   After addChild (needs to be in the DOM)!
          if (self._moveable) {
            self._moveable.destroy();
            self._moveable = null;
          }
          //noinspection JSPotentiallyInvalidConstructorUsage
          self._moveable = new move.constrainedMoveable(
            self.domNode,
            {
              handle: self._dragBarNode,
              delay: 50, // necessary to distinguish from button clicks
              constraints : function (e) {
                return {
                  t: 10,
                  l: 0,
                  w: container._rightSentinel._getTargetLeftPosition() + domStyle.get(e.node, "width") + gap,
                  h: domStyle.get(e.node, "height")
                };
              },
              within : true
            }
          );
          self._moveable.onMoveStart = function() {self._moveStart();};
          self._moveable.onMoved = function(mover, leftTop) {self._move(mover, leftTop);};
          self._moveable.onMoveStop = function(mover) {self._moveStop(mover);};
          self.own(self._moveable);
          self._addToListAfter(pane); // now add it to the list, so it can be repositioned
          container.focus(); // focus, so no other is
          if (container._repositionAnimations) {
            container._repositionAnimations.stop(true);
          }
          var anim = container._leftSentinel._repositionFromHereToRightAnimations();
          anim.push(baseFx.fadeIn({
            node: self.domNode,
            duration: 500
          }));
          anim = fx.combine(anim);
          anim.onEnd = function() {
            self.focus();
            container.resize();
            self.domNode.scrollIntoView();
            container._onTheMove = null;
          };
          container._repositionAnimations = anim;
          anim.play();
        },

        removeFromContainer: function() {
          // summary:
          //   Removes the current pane from the double linked list it is in. This widget is destroyed.

          if (!this.isInList()) {
            return;
          }
          var self = this;
          var /*DraggablePane*/ nextFocus = ((self.previous !== self.getFirst()) ? self.previous :
                           ((self.next !== self.getLast()) ? self.next : self.container));


          var container = self.container;
          if (self._moveable) {
            self._moveable.destroy();
            self._moveable = null;
          }
          self._removeFromList();
          self.container = null;
          nextFocus.focus();
          if (container._repositionAnimations) {
            container._repositionAnimations.stop(true);
          }
          var anim = container._leftSentinel._repositionFromHereToRightAnimations();
          anim.push(baseFx.fadeOut({
            node: self.domNode,
            duration: 500
          }));
          anim = fx.combine(anim);
          anim.onEnd = function() {
            self.destroyRecursive();
            container.resize();
            nextFocus.focusNode.scrollIntoView();
          };
          container._repositionAnimations = anim;
          anim.play();
        },

        isVisualizationOf: function(object) {
          // summary:
          //   This is a visualization of `object`.

          return this._c_ABSTRACT(object); // return Boolean
        },

        findVisualizationOf: function(object) {
          return this.isVisualizationOf(object) ? this : this.next.findVisualizationOf(object);
        },

        _getWidth: function() {
          // summary:
          //   The width of the DraggablePane currently, however it is come by.
          //   Private, internal function.

          return domStyle.get(this.domNode, "width");
        },

        _isAfter: function(/*Number*/ referencePosition) {
          // summary:
          //   The center of this is after the mouse.

          var margins = domGeom.getMarginBox(this.domNode);
          var center = margins.l + (margins.w / 2);
          return referencePosition < center;
        },

        _getTargetRightPosition: function(/*Number?*/ referencePosition) {
          // summary:
          //   Returns the right x-coordinate of the widget
          // description:
          //   The right position of the widget is the left position + its width, with an extra if this is focused.

          return this._getTargetLeftPosition(referencePosition) + this._getWidth() + ((this.get("focused") && this.next !== this.getLast()) ? extraGapForFocused : 0);
        },

        _getTargetLeftPosition: function(/*Number?*/ referencePosition) {
          // summary:
          //   Returns the left x-coordinate of the widget if it is in the double-linked-list of
          //   a HorizontalPanesContainer. If a drag is active, this takes into account the drop-gap.
          // description:
          //   Will loop through all the previous widgets in the linked list to determine it's left position.
          //   The left position is the right position of the previous widget + the gap in between the widgets.

          var leftPos = this.inherited(arguments);
          if ((!referencePosition || referencePosition !== 0) && this.get("focused") && (this.previous !== this.getFirst())) {
            leftPos += extraGapForFocused;
          }
          return leftPos;
        },

        focus: function() {
          focus.focus(this.focusNode);
        },

        _getFocusedAttr: function() {
          // summary:
          //   The `focused` property says whether this pane has focus or not.
          //   This property does not send events.

          //   TODO should not be necessary, since focus injects something? but unclear to me now
          return focus.get("activeStack").indexOf(this.id) >= 0;
        },

        _repositionFromHereToRightAnimations: function(/*Number?*/ referencePosition) {
          // summary:
          //   Animations to reposition the widgets to be placed horizontally next to each other, for this
          //   and all panes to the right.
          // description:
          //   Returns an array of Animations to do the dance.

          var focused = this.get("focused");
          domClass.toggle(this.domNode, "focused", focused);
          var top = 10;
          if (focused) {
            this.domNode.scrollIntoView();
            top = 7;
          }
          var animations = this.next._repositionFromHereToRightAnimations(referencePosition);
          var margins = domGeom.getMarginBox(this.domNode);
          var targetLeft = this._getTargetLeftPosition(referencePosition);
          if ((referencePosition || referencePosition === 0) && Math.abs(targetLeft - margins.l) <= gap) {
            // don't bother for small moves during drag
            return animations;
          }
          var myAnimation = fx.slideTo({
            node: this.domNode,
            top:  top,
            left: this._getTargetLeftPosition(referencePosition),
            unit: "px",
            duration: (referencePosition || referencePosition === 0) ? dragAnimationDuration : moveAnimationDuration
          });
          animations.push(myAnimation);
          return animations;
        },

        _moveStart: function() {
          // summary:
          //   This method is called when the user begins dragging the widget.
          //   Only works for movable instances.

          if (!this.container._onTheMove) {
            this.domNode.style.zIndex = 999;
            this.domNode.style.opacity = 0.5;
            var next = this.get("next");
            this.container._onTheMove = this;
            this._removeFromList();
            this.focus();
          }
        },

        _move: function(mover, leftTop) {
          // summary:
          //   This method is called when the user is dragging the widget around and will reposition the widgets
          //   according to the movements.
          //   Only works for movable instances.

          var center = leftTop.l + (this._getWidth() / 2);
          this.container._leftSentinel.reposition(center);
        },

        _moveStop: function() {
          // summary:
          //   This method is called when the user lets go of the widget, stopping the movement
          //   Only works for movable instances.

          if (this.container._onTheMove === this) {
            this.domNode.style.zIndex = 1;
            this.domNode.style.opacity = 1;
            var margins = domGeom.getMarginBox(this.domNode);
            var center = margins.l + (margins.w / 2);
            this.container._onTheMove = null;
            this._addToListAfter(this.get("container")._rightSentinel._getLastBeforeMouseAndThis(center));
            this.getFirst().reposition();
            this.focus();
          }
        }

      });

      DraggablePane.LeftSentinel = LeftSentinel;
      DraggablePane.RightSentinel = RightSentinel;
      DraggablePane.mid = module.id;
      return DraggablePane;

    });
