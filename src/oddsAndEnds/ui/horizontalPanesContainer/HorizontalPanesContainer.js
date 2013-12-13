define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_Container", "dijit/layout/_ContentPaneResizeMixin", "ppwcode-util-contracts/_Mixin",
        "./DraggablePane", "dojo/dnd/move",
        "dojo/_base/fx", "dojo/dom-class", "dojo/dom-style", "dojo/_base/lang",
        "dijit/focus",
        "module"],
    function(declare, _WidgetBase, _Container, _ContentPaneResizeMixin, _ContractsMixin,
             DraggablePane, move,
             fx, domClass, domStyle, lang,
             focus,
             module) {

      var HorizontalPanesContainer = declare([_WidgetBase, _Container, _ContentPaneResizeMixin, _ContractsMixin], {
        // summary:
        //   A HorizontalPanesContainer is a container for DraggablePanes.
        //   DraggablePanes are full height, and are visualized next to each other as a horizontal
        //   sequence. Users can add panes, remove panes, and change their position using DnD.
        //   Panes can have a focus.
        //   This widget adds support for the assumption that all or most panes in this HorizontalPanesContainer
        //   will represent an object.
        //   Panes are "opened" for an object. If there is already a Pane open for a given object,
        //   it is focused and brought into the viewable area, and highlighted. Otherwise, a new DraggablePane
        //   is created for the given object.A factory returns an appropriate instance of (a subtype of)
        //   DraggablePane. The instance returned by the factory must be prepared in full, with a target set.

        doLayout: false,

        tabindex: 0,

        _leftSentinel: null,
        _rightSentinel: null,

        _onTheMove: null,

        constructor: function() {
          this._leftSentinel = new DraggablePane.LeftSentinel(this);
          this._rightSentinel = new DraggablePane.RightSentinel(this);
          this._leftSentinel.next = this._rightSentinel;
          this._rightSentinel.previous = this._leftSentinel;
          var leftSentinel = this._leftSentinel;
          this.own(focus.watch("activeStack", function(name, oldFocusStack, newFocusStack) {
            if (!this._repositionAnimations && !this._onTheMove) {
              var leftMostChanged = leftSentinel._focusChanged(oldFocusStack, newFocusStack);
              if (leftMostChanged) { // any change, we reposition everything; seriously
                leftSentinel.reposition();
              }
            }
          }));
        },

        postCreate: function() {
          this.focusNode = this.domNode;
          domStyle.set(this.domNode, "overflow-x", "auto");
        },

        focus: function() {
          focus.focus(this.focusNode);
        },

        addPane: function(/*DraggablePane*/ pane, /*DraggablePane?*/ after) {
          this._c_pre(function() {return pane;});
          this._c_pre(function() {return !pane.isInList();});
          this._c_pre(function() {return !after || after.isIn(this);});

          pane.addToContainerAfter(after || this._rightSentinel.previous);
        },

        removePane: function(/*DraggablePane*/ pane) {
          // summary:
          //   Remove the widget from the linked list, reposition all the widgets and destroy it.
          this._c_pre(function() {return pane;});

          pane.removeFromContainer();
        },

        findVisualizationOf: function(/*Object*/ object) {
          return this._leftSentinel.findVisualizationOf(object);
        },

        focusOn: function(/*DraggablePane*/ pane) {
          // summary:
          //   Scroll to make pane visible, and highlight it.
          this._c_pre(function() {return pane && pane.isIn(this);});

          pane.focus();
          setTimeout(
            function() {
              domStyle.set(pane.domNode, "opacity", "0.3");
              // a flash
              fx.fadeIn({
                node: pane.domNode,
                duration: 750
              }).play();
            },
            200 // time to focus
          );
        },

        openPaneFor: function(/*Object*/ object, /*DraggablePane?*/ after) {
          // summary:
          //   Open a Draggable pane for `object`, to the right of `after`, or at the right end
          //   of this visualization.
          this._c_pre(function() {return object;});

          var pane = this.findVisualizationOf(object);
          if (pane) {
            this.focusOn(pane);
            return pane;
          }
          pane = this._freshDraggablePaneFor(object);
          this.addPane(pane, after);
          return pane;
        },

        _freshDraggablePaneFor: function(/*Object*/ object) {
          this._c_pre(function() {return !this.findVisualizationOf(object);});

          this._c_ABSTRACT(object);
        }

      });

      HorizontalPanesContainer.mid = module.id;

      return HorizontalPanesContainer;

    });
