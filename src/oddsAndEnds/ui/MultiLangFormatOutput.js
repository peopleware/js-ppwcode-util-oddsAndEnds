define(["dojo/_base/declare", "ppwcode/oddsAndEnds/ui/_MultiLangOutput", "dojo/_base/lang", "ppwcode/oddsAndEnds/xml"],
  function(declare, _MultiLangOutput, lang, xml) {

    return declare([_MultiLangOutput], {
      // summary:
      //   _MultiLangOutput that uses this.format to output this.value. The default this.format
      //   simply does this.value.toString() with escapeXml.

      format: function(/***/ value, /*Object*/ options) {
        if (!value) {
          return value;
        }
        var escapeXml = !options || options.escapeXml !== false; // default true
        return escapeXml ? xml.escape(value.toString()) : value.toString();
      },

      // formatOptions: Object
      //   Passed as options when formatting `value`.
      formatOptions: null,

      _output: function() {
        var outputNode = this.srcNodeRef || this.domNode;
        var result;
        if (!this.value) {
          result = this.get("missing");
        }
        else {
          var opt = this.formatOptions ? lang.clone(this.formatOptions) : {};
          opt.na = this.get("missing"); // overwrite
          if (!opt.locale) { // formatOptions have precedence
            opt.locale = this.findLang();
          }
          // default for escapeXml (where applicable) should be true; default is false in formatter
          // so, we need to set it to true, if it was not explicitly set to false in the formatOptions
          if (opt.escapeXml !== false) {
            opt.escapeXml = true;
          }
          result = this.format(this.value, opt);
        }
        outputNode.innerHTML = result;
      }

    });
  }
);
