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
  "ppwcode-util-oddsAndEnds/_PropagationMixin", "dojox/mobile/ListItem", "dojo/dom-class", "dojo/Stateful",

  "dojox/mobile/Container", "dojox/mobile/EdgeToEdgeList",
  "xstyle/css!dojox/mobile/themes/iphone/iphone.css",
  "xstyle/css!./multiSelect.css"],
  function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, _PropagationMixin, ListItem, domClass, Stateful) {

    return declare([Stateful, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      // summary:
      //   Widget that is specially made to represent a multi select component.

      templateString: template,

      // _ulNode: UL HTML element in template
      _ulNode: null,

      // value: Array
      value: [],
      // disabled: Boolean
      disabled: null,

      _getValueAttr: function () {
        if (this.value) {
          return this.value.slice();
        } else {
          return undefined;
        }
      },

      format: function (option) {
        return option ? option.toString() : "";
      },

      icon: function () {
        return undefined;
      },

      _setOptionsAttr: function (options) {
        var self = this;
        if (self._ulNode && !self._ulNode.hasChildren() && options && options.length > 0) {
          options.forEach(function (element) {
            var li = new ListItem({label: self.format(element), icon: self.icon(), preventTouch: !!self.get("disabled")});

            self.own(li.watch("checked", function (propName, oldValue, newValue) {
              if (oldValue !== newValue) {
                var changedArray;
                var curValue = self.get("value");
                if (newValue) {
                  if (curValue) {
                    if (curValue.indexOf(element) < 0) {
                      changedArray = curValue;
                      changedArray.push(element);
                    } else {
                      changedArray = curValue;
                    }
                  } else {
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
            self.own(self.watch("value", function (propName, oldIl, newIl) {
              li.set("checked", newIl.indexOf(element) >= 0);
            }));
            self.own(self.watch("disabled", function (propName, oldIl, newIl) {
              li.set("preventTouch", !!newIl);
            }));
            self._ulNode.addChild(li);
          });
        }
      }

    });
  }
);
