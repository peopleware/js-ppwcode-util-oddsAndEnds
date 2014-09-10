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

define(["dojo/_base/declare", "dijit/_WidgetBase", "../xml"],
  function(declare, _WidgetBase, xml) {

    return declare([_WidgetBase], {
      // summary:
      //   Widget based on dojox/mvc/Output.
      //   Outputs a value, xml-escaped by default.
      //   If there is no value, outputs `missing`.

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      startup: function() {
        this.inherited(arguments);
        this._output();
      },

      _setValueAttr: function(value) {
        this._set("value", value);
        if (this._created) {
          this._output();
        }
      },

      _setMissingAttr: function(value) {
        this._set("missing", value);
        if (this._created) {
          this._output();
        }
      },

      _setEscapeXmlAttr: function(value) {
        this._set("escapeXml", value);
        if (this._created) {
          this._output();
        }
      },

      _output: function(){
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var outputNode = this.srcNodeRef || this.domNode;
        var cleanValue = this.escapeXml ? xml.escape(this.value, false) : this.value;
        outputNode.innerHTML = (cleanValue || cleanValue === 0 || cleanValue === "0") ? cleanValue : this.missing;
      }

    });
  }
);
