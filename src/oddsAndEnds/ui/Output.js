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
