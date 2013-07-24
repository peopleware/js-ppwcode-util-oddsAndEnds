define(["../../../dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/dom-style", "dojo/fx"],
  function(declare, _WidgetBase, domStyle, fx) {

    return declare([_WidgetBase], {
      // summary:
      //   Widgetizes any domNode, to make it optional.
      //   If `displayed` is set to true, the widget appears. If `displayed` is set
      //   to false, it disappears. The default is not-displayed.
      // description:
      //   Changing the state is done with an animation. Although `set("displayed", value)`
      //   returns immediately, the operation takes a while.
      //   For now, there is no option to get a Promise on the animation.

      // displayed: boolean
      displayed: false,

      postCreate: function() {
        this.inherited(arguments);
        domStyle.set(this.domNode, "display", "none");
      },

      _setDisplayedAttr: function(displayed) {
        // summary:
        //   Executes the change of being displayed. Since the visual
        //   effect takes time, this returns a Promise. Use it or not, as you like.
        //   Returns null if the value is not changed.

        if (this.displayed == displayed) {
          this._set("displayed", displayed);
          displayed ? this._animation().show() : this._animation().hide();
        }
      },

      _animation: function() {
        //noinspection JSUnresolvedFunction
        return new fx.Toggler({
          node: self.domNode,
          showDuration: 500,
          hideDuration: 500,
          showFunc: fx.wipeIn,
          hideFunc: fx.wipeOut
        });
      }

    });
  }
);
