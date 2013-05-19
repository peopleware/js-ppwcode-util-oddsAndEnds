define(["dojo/_base/declare", "dijit/_WidgetBase",
        "dojo/dom", "../xml", "dojo/_base/lang", "dojo/regexp"],
  function(declare, _WidgetBase,
           dom, xml, lang, regexp) {

    return declare([_WidgetBase], {
      // summary:
      //   Widget based on dojox/mvc/Output. The only difference
      //   is that the shown text is xml-escaped by default before it is put
      //   in the HTML.

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
      templateString : "",

      postscript: function(params, srcNodeRef){
        // summary:
        //		Override and save template from body.

        this.srcNodeRef = dom.byId(srcNodeRef);
        if(this.srcNodeRef){
          this.templateString = this.srcNodeRef.innerHTML;
          this.srcNodeRef.innerHTML = "";
        }
        this.inherited(arguments);
      },

      postCreate: function() {
        this._output();
      },

      _setValueAttr: function(value) {
        this._set("value", value);
        this._output();
      },

      _setExprCharAttr: function(value) {
        this._set("exprChar", value);
        this._output();
      },

      _setMissingAttr: function(value) {
        this._set("missing", value);
        this._output();
      },

      _setEscapeXmlAttr: function(value) {
        this._set("escapeXml", value);
        this._output();
      },

      _setTemplateStringAttr: function(value) {
        this._set("templateString", value);
        this._output();
      },

      _output: function(){
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var self = this;

        function transform(value){
          if(!value) {
            return "";
          }
          var exp = value.substr(2);
          exp = exp.substr(0, exp.length - 1);
          var val;
          with (self) {
            val = eval(exp);
          }
          val = self.escapeXml ? xml.escapeXml(val) : val;
          return (val || val == 0 ? val : self.missing);
        }

        var outputNode = this.srcNodeRef || this.domNode;
        if (this.templateString) {
          var result = self.templateString.replace(
            new RegExp(regexp.escapeString(self.exprChar)+"(\{.*?\})","g"),
            transform
          );
          outputNode.innerHTML = result;
        }
        else {
          var cleanValue = self.escapeXml ? xml.escape(self.value, false) : self.value;
          outputNode.innerHTML = (cleanValue || cleanValue == 0) ? cleanValue : self.missing;
        }
      }

    });
  }
);
