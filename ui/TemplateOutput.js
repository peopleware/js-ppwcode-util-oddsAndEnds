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

define(["dojo/_base/declare", "dijit/_WidgetBase",
        "dojo/dom", "../xml", "dojo/regexp"],
  function(declare, _WidgetBase,
           dom, xml, regexp) {

    return declare([_WidgetBase], {
      // summary:
      //   Output with the innerHtml of the widget as a template.
      //   Expressions of the form @{...} are evaluated in the context
      //   of the widget.
      //   A missing value is replaced by `missing`.
      //   The result of the evaluation is xml-escaped by default.
      //   Every call to "set" re-renders.

      /* Note:
         We explicitly do use innerHTML in this module, and not direct DOM-manipulation (using dom-construct).
         The latter is what we should do, but in this case it is all about manipulating a text template representation
         of a DOM. There might be a better way to do that, but for now we focus on the text manipulation. */

      // exprChar: String
      //   "$" cannot be used, because it conflicts
      //   with templated widgets, where ${} is already used.
      exprChar: "@",

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // templateString: [private] String
      //		The template or data-bound output content.
      templateString: "",

      postscript: function(params, srcNodeRef) {
        // summary:
        //		Override and save template from body.

        this.srcNodeRef = dom.byId(srcNodeRef);
        if (this.srcNodeRef) {
          // See Note for InnerHTMLJS
          //noinspection InnerHTMLJS
          this.templateString = this.srcNodeRef.innerHTML;
          //noinspection InnerHTMLJS
          this.srcNodeRef.innerHTML = "";
        }
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this._output();
      },

      set: function(name, value) { // jshint ignore:line
        // summary:
        //		Override and refresh output on value change.
        // name:
        //		The property to set.
        // value:
        //		The value to set in the property.
        this.inherited(arguments);
        if (this._created) {
          this._output();
        }
      },

      _output: function() {
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var self = this;

        function transform(value) {
          if (!value) {
            return "";
          }
          var exp = value.substr(2);
          exp = exp.substr(0, exp.length - 1);
          var val;
          try {
            //noinspection WithStatementJS,JSHint
            with (self) {
              val = eval(exp); // jshint ignore:line
            }
          }
          catch (err) {
            // on error, we give info, and then treat it as missing data
            console.info("INFO error parsing Output template '" + exp + "': " +
                         err.message + " -- using string for missing data");
          }
          val = self.escapeXml ? xml.escape(val) : val;
          return (val || val === 0 || val === "0") ? val : self.missing;
        }

        var outputNode = this.srcNodeRef || this.domNode;
        // See Note for InnerHTMLJS
        if (this.templateString) {
          //noinspection InnerHTMLJS
          outputNode.innerHTML = self.templateString.replace(
            new RegExp(regexp.escapeString(self.exprChar) + "(\{.*?\})", "g"),
            transform
          );
        }
        else {
          var cleanValue = self.escapeXml ? xml.escape(self.value, false) : self.value;
          //noinspection InnerHTMLJS
          outputNode.innerHTML = (cleanValue || cleanValue === 0 || cleanValue === "0") ? cleanValue : self.missing;
        }
      }

    });
  }
);
