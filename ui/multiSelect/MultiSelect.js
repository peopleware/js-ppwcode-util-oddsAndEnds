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
        "dojo/text!./multiSelect.html",
        "dojox/mobile/ListItem", "dojo/dom-construct", "../../js",

        "dojox/mobile/Container", "dojox/mobile/EdgeToEdgeList",
        "xstyle/css!./multiSelect.css"],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, ListItem, domConstruct, js) {

    function alphabeticLabelSort(one, other) {
      // summary:
      //   Options are sorted alphabetically by label (the result of
      //   `format` applied to the element).
      //   If this is set to a falsy value, options are kept in the order they are provided to
      //   `set("options", options)`. Accepts any other sort function.
      //   Use `set("sort", sortFunction)` to change the sort function "live".

      return this.format(one) < this.format(other) ? -1 : +1;
    }

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      // summary:
      //   Widget that is specially made to represent a multi select component.
      //   If sorted is true, the options are sorted by label.

      templateString: template,

      // _edgeToEdgeList: EdgeToEdgeList
      _edgeToEdgeList: null,
      /* TODO this should have been a ul DOMNode, and we should have taken over the code of the edgeToEdge(?) list,
         to become independent of dojox/mobile. It seems this was not done as intended. */

      // value: Array
      value: null,

      // disabled: Boolean
      disabled: false,

      // sorted: Boolean
      //   If true, the options will be sorted by label.
      // deprecated
      // summary:
      //   Kept for backward compatibility.
      //   We sort alphabetically by label when sort === alphabeticLabelSort and sorted === true.
      //   We sort by sort when sort is any other function.
      //   We don't sort if sort is not a function or (sort === alphabeticLabelSort and sorted === false).
      sorted: false, // TODO remove soon

      // sort: Function
      //   Sort function for the options. By default, options are sorted alphabetically by label (the result of
      //   `format` applied to the element).
      //   If this is set to a falsy value, options are kept in the order they are provided to
      //   `set("options", options)`. Accepts any other sort function.
      //   Use `set("sort", sortFunction)` to change the sort function "live".
      sort: alphabeticLabelSort,

      _setSortAttr: function(sort) {
        this._set("sort", sort);
        this._render();
      },

      _getValueAttr: function() {
        // summary:
        //   Override of the 'value' getter. This getter returns a copy of the value array instead of the array itself.

        return this.value ? this.value.slice() : this.value;
      },

      format: function(/*Object*/ option) {
        // summary:
        //   Formats the option to a string that will be used in the label of the ListItem.
        //   The default behaviour of this function is to do a toString on the option value.
        //   Override this to add i18n or apply any formatting on the option value.
        //   This function should return a String that should be used in the ListItem's label value.

        return option ? option.toString() : "";
      },

      icon: function(/*Object*/ option) {
        // summary:
        //   Override this function if you want an icon to be displayed before the option in the list.
        //   This function should return a valid icon value as explained in the dojox/mobile/ListItem API.

        return undefined;
      },

      _clearList: function() {
        // summary:
        //   Clears all the list items from the UL list.

        if (this._edgeToEdgeList) {
          this._edgeToEdgeList.destroyDescendants();
          domConstruct.empty(this._edgeToEdgeList.domNode);
        }
      },

      _setOptionsAttr: function(/*Object[]*/ options) {
        // summary:
        //   Setter of the 'options' property.
        //   This function will clear the contents of the entire list and remove all watch-handles to free memory.
        //   Then new ListItems will be created based on the incoming array of options.
        //   The necessary watchers are added to the ListItems to add the desired behaviour.

        this._set("options", options);
        this._render();
      },

      _render: function() {
        // summary:
        //   Clear the visuale representation of the select, and render it anew.
        //   This function will clear the contents of the entire list and remove all watch-handles to free memory.
        //   Then new ListItems will be created based on the current array of options.
        //   The necessary watchers are added to the ListItems to add the desired behaviour.

        var self = this;

        function liCheckChanged(element) {
          return function(propName, oldChecked, newChecked) {
            if (oldChecked === newChecked) {
              return;
            }

            var currentValueArray = self.get("value");
            if (newChecked) { // element should be in value
              if (!currentValueArray) {
                self.set("value", [element]); // there was no value yet: singleton
              }
              else if (currentValueArray.indexOf(element) < 0) {
                // element was not in value: add it
                var newValueArray = currentValueArray.slice();
                newValueArray.push(element);
                self.set("value", newValueArray);
              } // else, was already in value: NOP
            }
            else if (currentValueArray) { // element should not be in value: remove it
              self.set("value", currentValueArray.filter(function(el) {
                return el !== element;
              }));
            }
          }
        }

        self._clearList();
        var options = self.get("options");
        if (self._edgeToEdgeList && options && options.length > 0) {
          var currentValueArray = self.get("value");
          var sortFunction = self.get("sort");
          if (js.typeOf(sortFunction) === "function" && (sortFunction !== alphabeticLabelSort || self.get("sorted"))) {
            options = options.slice(); // others could be using the array
            options.sort(sortFunction);
          }
          var listItems = options.map(function(element) {
            var li = new ListItem({
              label: self.format(element),
              icon: self.icon(element),
              checked: !!(currentValueArray && currentValueArray.indexOf(element) >= 0),
              // check if element is in the current value array
              preventTouch: !!self.get("disabled")
            });
            li.own(li.watch("checked", liCheckChanged(element)));
            li.own(self.watch("value", function(propName, oldIl, newIl) {
              li.set("checked", !!(newIl && newIl.indexOf(element) >= 0)); // check if element is in the new value array
            }));
            li.own(self.watch("disabled", function(propName, oldIl, newIl) {li.set("preventTouch", !!newIl);}));
            return li;
          });
          listItems.forEach(function(li) {self._edgeToEdgeList.addChild(li);});
        }
      },

      destroy: function(/*Boolean*/ preserveDom) {
        if (this._edgeToEdgeList) {
          this._edgeToEdgeList.destroyDescendants(preserveDom);
          this._edgeToEdgeList.destroy(preserveDom);
        }
        ;
      }

    });
  }
);
