/*
 Copyright 2013 by PeopleWare n.v.

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

define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./onePropertyCrdList.html", "dojo/store/Memory",
        "ppwcode-util-oddsAndEnds/_PropagationMixin", "dojox/mobile/ListItem",
        "dojo/dom-style", "dojo/dom-class", "dojo/dom-construct", "dojo/on",
        "dijit/form/Button", "../../log/logger!", "dojo/Deferred",

        "dojox/mobile/Container", "dojox/mobile/EdgeToEdgeList", "dijit/form/ComboBox",
        "xstyle/css!./onePropertyCrdList.css"],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
           template, Memory,
           _PropagationMixin, ListItem,
           domStyle, domClass, domConstruct, on,
           Button, ComboBox, logger, Deferred) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _PropagationMixin], {
      // summary:
      //   Widget that is specially made to represent a list with only 1 property per element.
      //   Elements can be added or removed.
      //   When the getData() function is overridden, the input box will support auto-complete.

      templateString: template,

      // _addTextWrapperNode: DOMNode
      _addTextWrapperNode: null,

      // _comboBox: ComboBox
      _comboBox: null,

      // _edgeToEdgeList: EdgeToEdgeList
      _edgeToEdgeList: null,

      // _edgeToEdgeListNodeWrapperNode: DOMNode
      _edgeToEdgeListNodeWrapperNode: null,

      // _autoCompleteStore: Memory
      _autoCompleteStore: null,

      // getData: function
      // summary:
      //   Function that gets the data to use in the auto-complete. Returns a Promise for the
      //   array of data.
      // description:
      //   This function should return an array with objects that have a displayValue.
      //   This is a property that is used to search on when trying to auto-complete.
      getData: function() {
        var deferred = new Deferred();
        deferred.resolve([]);
        return deferred.promise;
      },

      placeHolder: "",

      height: null,

      // value: Array, never null
      value: null,

      // disabled: Boolean
      disabled: null,

      "-propagate-": {
        value: [{path: "_propagateValue", exec: true}]
      },

      constructor: function() {
        this.value = [];
        this._autoCompleteStore = new Memory();
      },

      _clearList: function() {
        // summary:
        //   Clears all the list items from the UL list.

        if (this._edgeToEdgeList && this._edgeToEdgeList._started && !this._edgeToEdgeList._destroyed) {
          // method is called during destruction, when the target is unset
          this._edgeToEdgeList.destroyDescendants();
          domConstruct.empty(this._edgeToEdgeList.domNode);
        }
      },

      _propagateValue: function(/*Array*/ valueArray) {
        var self = this;
        self._clearList();
        var enabled = !self.get("disabled");

        function listenForDelete(liElements, count) {
          if (count > 20) {
            logger.warn("Could not create listeners for delete clicks for 20 iterations. Giving up.");
            self.set("disabled", true);
          }
          var leftOver = [];
          liElements.forEach(function(liElement) {
            if (!liElement.li.rightIconNode) {
              leftOver.push(liElement);
              return;
            }
            liElement.li.own(on(
              liElement.li.rightIconNode,
              "click",
              function() {
                if (!self.get("disabled")) {
                  var arr = self.get("value");
                  var idx = arr.indexOf(liElement.value);
                  arr.splice(idx, 1);
                  self.set("value", arr);
                }
              }
            ));
          });
          if (leftOver.length > 0) {
            listenForDelete(leftOver, count + 1);
          }
        }


        if (self._edgeToEdgeList && valueArray && valueArray.length > 0) {
          var liElements = valueArray.map(function(element) {
            var li = new ListItem({label: self.format(element), rightIcon: enabled ? "mblDomButtonRedCross" : null});
            self._edgeToEdgeList.addChild(li);
            return {li: li, value: element};
          });
          if (enabled) {
            // the rightIconNode is added later, on a future tick; we can only connect after it appears
            listenForDelete(liElements, 1);
          }
        }
      },

      _getValueAttr: function() {
        return this.value.slice();
      },

      _getDisabledAttr: function() {
        return !!this.disabled;
      },

      format: function(val) {
        return val ? val.toString() : "N/A";
      },

      parse: function(formattedValue) {
        return formattedValue ? formattedValue.toString() : "N/A";
      },

      _setHeightAttr: function(/*String*/ height) {
        this.inherited(arguments);
        domStyle.set(this._edgeToEdgeListNodeWrapperNode, "height", height);
      },

      _setDisabledAttr: function(disabled) {
        this._set("disabled", disabled);
        if (!disabled) {
          this._initAutoCompleteInputField();
        }
        else {
          this._deInitAutoCompleteInputField();
        }
        domClass.toggle(this._addTextWrapperNode, "enabled", !disabled);
        this._propagateValue(this.get("value")); // to clear the list and render it completely fresh
      },

      _initAutoCompleteInputField: function() {
        var self = this;
        if (!self.getData) {
          throw "ERROR: No getData function specified";
        }
        var loaded = self.getData();
        var comboBoxInitialiased = loaded.then(
          function(result) {
            if (self._comboBox) {
              self._autoCompleteStore.setData(result);
              self._comboBox.set("autocomplete", !!(result && result.length > 0));
            }
          },
          function(err) {
            logger.error("Error loading emergency numbers used: ", err);
            throw err;
          }
        );
      },

      _deInitAutoCompleteInputField: function() {
        if (this._comboBox) {
          this._comboBox.set("autocomplete", false);
        }
      },

      // TODO add "enter from keyboard"

      addClicked: function() {
        var fieldValue = this._comboBox.get("value");
        var valueToAdd = this.parse(fieldValue);
        if (valueToAdd && valueToAdd.trim() !== "") {
          var arr = this.get("value");
          if (arr.indexOf(valueToAdd) < 0) {
            arr.push(valueToAdd);
            arr.sort();
            this.set("value", arr);
          }
          this._comboBox.set("value", "");
        }
      }

    });
  }
)
;
