/*
Copyright 2012 - $Date $ by PeopleWare n.v.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/dom-style"],
  function(declare, _WidgetBase, domStyle) {

    return declare([_WidgetBase], {
      // summary:
      //   Widgetizes any domNode, to make it optional.
      //   If `displayed` is set to true, the widget appears. If `displayed` is set
      //   to false, it disappears. The default is not-displayed.
      // description:
      //   Changing the state is not done with an animation.

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

      postCreate: function() {
        this.inherited(arguments);
        this._setDisplay();
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
        this._set("displayed", booleanDisplayed);
        this._setDisplay();
      },

      _setDisplay: function() {
        if (this.shown()) {
          domStyle.set(this.domNode, "display", "");
        }
        else {
          domStyle.set(this.domNode, "display", "none");
        }
      }

    });
  }
);
