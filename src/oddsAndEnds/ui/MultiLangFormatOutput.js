define(["dojo/_base/declare", "ppwcode/oddsAndEnds/ui/_MultiLangOutput", "dojo/_base/lang", "ppwcode/oddsAndEnds/xml"],
  function(declare, _MultiLangOutput, lang, xml) {

    function defaultFormat(/***/ value, /*Object*/ options) {
      return value ? value.toString() : options.na;
    }

    return declare([_MultiLangOutput], {
      // summary:
      //   _MultiLangOutput that uses this.format to output this.value. The default this.format
      //   simply does this.value.toString() with escapeXml.

      "-chains-": {
        _extraFormatOption: "after"
      },

      // value: Object?
      value: null,

      // format: Function(/*Object*/ value, /*Object*/ options)
      //    Can be set to something. Alternatively, overwrite getFormat. If null, defaultFormat is used.
      format: null,

      // formatOptions: Object
      //   Passed as options when formatting `value`.
      formatOptions: null,

      _extraFormatOption: function(/*Object*/ options) {
        // summary:
        //   Subclasses can enforce extra properties on the options object
        //   passed to this.value.constructor.format.
        //   Chained.

        // NOP
      },

      _output: function() {
        var outputNode = this.srcNodeRef || this.domNode;
        var result;
        if (!this.value) {
          result = this.get("missing"); // is xmlEscaped
        }
        else {
          var opt = this.formatOptions ? lang.clone(this.formatOptions) : {};
          opt.na = this.get("missing"); // overwrite;
          if (!opt.locale) { // formatOptions have precedence
            opt.locale = this.get("lang");
          }
          this._extraFormatOption(opt);
          var /*Function*/ formatter = this.format || defaultFormat;
          result = formatter.call(null, this.value, opt); // formatters should never escape XML; it is not their job
          // default for escapeXml (where applicable) should be true
          if (opt.escapeXml !== false) {
            result = xml.escape(result);
          }
        }
        outputNode.innerHTML = result;
      }

    });
  }
);
