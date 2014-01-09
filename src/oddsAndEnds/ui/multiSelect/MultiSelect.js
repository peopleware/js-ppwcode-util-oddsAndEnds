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

define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./multiSelect.html",
  "dojox/mobile/ListItem", "dojo/dom-construct",

  "dojox/mobile/Container", "dojox/mobile/EdgeToEdgeList",
  "xstyle/css!dojox/mobile/themes/iphone/iphone.css",
  "xstyle/css!./multiSelect.css"],
  function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, ListItem, domConstruct) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      // summary:
      //   Widget that is specially made to represent a multi select component.
      //   If sorted is true, the options are sorted by label.

      templateString: template,

      // _ulNode: UL HTML element in template
      _ulNode: null,

      // value: Array
      value: [],

      // disabled: Boolean
      disabled: null,

      // sorted: Boolean
      //   If true, the options will be sorted by label.
      sorted: false,

      // _getValueAttr: Function
      //    Override of the 'value' getter. This getter returns a copy of the value array instead of the array itself.
      _getValueAttr: function () {
        if (this.value) {
          return this.value.slice();
        } else {
          return this.value;
        }
      },

      // format: Function
      //    Formats the option to a string that will be used in the label of the ListItem.
      //    The default behaviour of this function is to do a toString on the option value.
      //    Override this to add i18n or apply any formatting on the option value.
      //    This function should return a String that should be used in the ListItem's label value.
      format: function (/*String*/ option) {
        return option ? option.toString() : "";
      },

      // icon: Function
      //    Override this function if you want an icon to be displayed before every item in the list.
      //    This function should return a valid icon value as explained in the dojox/mobile/ListItem API.
      icon: function () {
        return undefined;
      },

      // _clearList: function
      //    Clears all the list items from the UL list.
      _clearList: function() {
        var self = this;
        if (self._ulNode) {
          self._ulNode.destroyDescendants();
          domConstruct.empty(self._ulNode.domNode);
        }
      },

      // _setOptionsAttr: Function
      //    Override of the setter of the 'options' property.
      //    This function will clear the contents of the entire list and remove all watch-handles to free memory.
      //    Then new ListItems will be created based on the incoming array of options.
      //    The necessary watchers are added to the ListItems to add the desired behaviour.
      _setOptionsAttr: function (/*Array of String*/ options) {
        var self = this;
        self._clearList();
        if (self._ulNode && options && options.length > 0) {
          var listItems = options.map(function (element) {
            var li = new ListItem({label: self.format(element), icon: self.icon(), preventTouch: !!self.get("disabled")});
            li.own(li.watch("checked", function (propName, oldValue, newValue) {
              if (oldValue !== newValue) {
                var changedArray;
                var curValue = self.get("value");
                if (newValue) {
                  if (curValue) {
                    if (curValue.indexOf(element) < 0) {
                      changedArray = curValue;
                      changedArray.push(element);
                    }
                    else {
                      changedArray = curValue;
                    }
                  }
                  else {
                    changedArray = [element];
                  }
                }
                else {
                  changedArray = curValue.filter(function (el) {
                    return el !== element;
                  });
                }
                self.set("value", changedArray);
              }
            }));
            li.own(self.watch("value", function (propName, oldIl, newIl) {
              li.set("checked", !!(newIl && newIl.indexOf(element) >= 0));
            }));
            li.own(self.watch("disabled", function (propName, oldIl, newIl) {
              li.set("preventTouch", !!newIl);
            }));
            return li;
          });
          if (self.get("sorted")) {
            listItems.sort(function(one, other) {return one.label < other.label ? -1 : +1;}); // sort by label
          }
          listItems.forEach(function(li) {
            self._ulNode.addChild(li);
          });
        }
      }

    });
  }
);
