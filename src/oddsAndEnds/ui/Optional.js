define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/dom-style", "dojo/fx/Toggler", "dojo/fx"],
  function(declare, _WidgetBase, domStyle, FxToggler, fx) {

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

      // reversed: boolean
      //   With a binding on `displayed`, certainly if it is several levels deep, the first
      //   actual `set("displayed")` happens quite late. `displayed` is initially false,
      //   so nothing is shown until the first `set("displayed")` happens in that case.
      //   With `reverse` true, we reverse the behavior: we show if `displayed` is false, and
      //   and hide if `displayed` is true. This also often makes the binding easier
      //   (no need for a format function).
      reversed: false,

      // _toggler: FxToggler
      _toggler: null,

      postCreate: function() {
        this.inherited(arguments);
        if (!this.shown()) {
          domStyle.set(this.domNode, "display", "none");
        }
        else {
          domStyle.set(this.domNode, "display", "");
        }
        this._toggler = new FxToggler({
          node: this.domNode,
          showDuration: 500,
          hideDuration: 500,
          showFunc: fx.wipeIn,
          hideFunc: fx.wipeOut
        });
      },

      shown: function() {
        return this.reversed ? !this.displayed : this.displayed;
      },

      _setDisplayedAttr: function(displayed) {
        // summary:
        //   Executes the change of being displayed. Since the visual
        //   effect takes time, this returns a Promise. Use it or not, as you like.
        //   Returns null if the value is not changed.

        var booleanDisplayed = !!displayed; // turn truthy or falsy into true or false
        if (booleanDisplayed != !!this.displayed) { // somebody DOES insert null into this.displayed directly; make sure we are comparing booleans
          this._set("displayed", booleanDisplayed);
          if (this.shown()) {
            domStyle.set(this.domNode, "display", "");
//            this._toggler.show();
          }
          else {
            domStyle.set(this.domNode, "display", "none");
//            this._toggler.hide();
          }
        }
      }

    });
  }
);
