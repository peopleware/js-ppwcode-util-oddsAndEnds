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

      // _showAnimation: Animation
      _showAnimation: null,

      // _hideAnimation: Animation
      _hideAnimation: null,

      _animateDelayHandler: null,
      _lastRenderedShown: false,

      postCreate: function() {
        this.inherited(arguments);
        if (this.shown()) {
          domStyle.set(this.domNode, "display", "");
          this._lastRenderedShown = true;
        }
        else {
          domStyle.set(this.domNode, "display", "none");
          this._lastRenderedShown = false;
        }
        this._showAnimation = fx.wipeIn({node: this.domNode, duration: 500});
        this._hideAnimation = fx.wipeOut({node: this.domNode, duration: 500});
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
          this._animate();
//          if (this.shown()) {
//            this._hideAnimation.stop();
//            this._showAnimation.play();
////            domStyle.set(this.domNode, "display", "");
//          }
//          else {
//            this._showAnimation.stop();
//            this._hideAnimation.play();
////            domStyle.set(this.domNode, "display", "none");
//          }
        }
      },

      _animate: function() {
        // summary:
        //   We start the animation with a delay, so that in that case of many fast switches,
        //   we get no flicker.

        if (this._animateDelayHandler) { // we were called in quick succession
          this._animateDelayHandler.remove();
          this._animateDelayHandler = null;
        }

        this._animateDelayHandler = this.defer(
          function() {
            this._animateDelayHandler = null;
            if (this.shown() && !this._lastRenderedShown) {
              this._hideAnimation.stop();
              this._lastRenderedShown = true;
              this._showAnimation.play();
            }
            else if (!this.shown() && this._lastRenderedShown) {
              this._showAnimation.stop();
              this._lastRenderedShown = false;
              this._hideAnimation.play();
            }
            // else NOP; we are where we need to be already
          },
          200
        );
      }

    });
  }
);
