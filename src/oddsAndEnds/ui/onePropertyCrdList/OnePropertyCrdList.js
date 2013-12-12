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

define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./onePropertyCrdList.html",
  "ppwcode-util-oddsAndEnds/_PropagationMixin", "dojox/mobile/ListItem", "dojox/mobile/Icon", "dojo/dom-style", "dojo/dom-class", "dojo/Stateful", "dojo/dom-construct",
  "dijit/form/Button", "dojo/i18n!./nls/labels",

  "dojox/mobile/Container", "dojox/mobile/EdgeToEdgeList",
  "xstyle/css!dojox/mobile/themes/iphone/iphone.css",
  "xstyle/css!./onePropertyCrdList.css"],
  function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, _PropagationMixin, ListItem, Icon, domStyle, domClass, Stateful, domConstruct, Button, labels) {

    return declare([Stateful, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _PropagationMixin], {
      // summary:
      //   Widget that is specially made to represent a list with only 1 property per element.
      //   Elements can be added or removed.

      templateString: template,
      labels: labels,

      // _ulNode: UL HTML element in template
      _ulNode: null,

      _ulNodeWrapper: null,

      _txtAdd: null,

      _addTextWrapperNode: null,

      height: null,

      // value: Array
      value: [],
      // disabled: Boolean
      disabled: null,

      "-propagate-": {
        value: [
          {path: "_propagateValue", exec: true}
        ]
      },

      _propagateValue: function (/*Array*/ valueArray) {
        var self = this;
        if (self._ulNode) {
          domConstruct.empty(self._ulNode.domNode);
          if (valueArray && valueArray.length > 0) {
            valueArray.forEach(function (element) {
              var li = new ListItem({label: self.format(element)});
              if (!self.get("disabled")) {
                var deleteIcon = new Button({showLabel: false, iconClass: "dijitIconDelete", class: "deleteIcon"});
                li.own(deleteIcon.on("click", function() {
                  if (!self.get("disabled")) {
                    if (window.confirm(labels.confirmDelete1 + self.format(element) + labels.confirmDelete2)) {
                      var arr = self.get("value");
                      var newArr = [];
                      arr.forEach(function (arrElement) {
                        if (element !== arrElement) {
                          newArr.push(arrElement);
                        }
                      });
                      self.set("value", newArr);
                    }
                  }
                }));
                li.addChild(deleteIcon);
              }
              if (!self.get("disabled")) {
                domClass.remove(li.domNode, "disabled");
              }
              else {
                domClass.add(li.domNode, "disabled");
              }
              self._ulNode.addChild(li);
            });
          }
        }
      },

      _getValueAttr: function () {
        if (this.value) {
          return this.value.slice();
        } else {
          return undefined;
        }
      },

      _getDisabledAttr: function () {
        return !!this.disabled;
      },

      format: function (val) {
        return val ? val.toString() : "";
      },

      parse: function (formattedValue) {
        return formattedValue ? formattedValue.toString() : "";
      },

      _setHeightAttr: function (height) {
        this.inherited(arguments);
        domStyle.set(this._ulNodeWrapper, "height", height);
      },

      _setDisabledAttr: function (disabled) {
        this.inherited(arguments);
        this.disabled = disabled;
        domStyle.set(this._addTextWrapperNode, "display", (!!disabled ? "none" : "block"));
        this._propagateValue(this._getValueAttr());
      },

      addClicked: function (e) {
        var fieldValue = this._txtAdd.get("value");
        var valueToAdd = this.parse(fieldValue);
        if (valueToAdd && valueToAdd.trim() !== "") {
          var arr = this.get("value");
          arr.push(valueToAdd);
          this.set("value", arr);
          this._txtAdd.set("value", "");
        }
      }

    });
  }
)
;
