define(["dojo/_base/declare", "./_MultiLangOutput", "dojo/date/locale", "dojo/_base/lang", "../js", "../log/logger!"],
  function(declare, _MultiLangOutput, dateLocale, lang, js, logger) {

    return declare([_MultiLangOutput], {
      // summary:
      //   Widget that is specially made to represent a i18n date in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //
      //   Every set re-renders.

      // formatOptions: dateLocale.__FormatOptions?
      formatOptions: null,

      // value: Date?
      value: null,

      _output: function() {
        // summary:
        //		Produce the data-bound output.
        // tags:
        //		protected

        var render;
        //noinspection FallthroughInSwitchStatementJS
        switch (js.typeOf(this.value)) {
          case "date":
            var options = lang.mixin({}, this.formatOptions);
            options.locale = this.findLang();
            render = dateLocale.format(this.value, options);
            break;
          case "null":
          case "undefined":
            render = this.get("missing");
            break;
          default:
            logger.warn("was asked to output not a date: ", this.value);
            render = "NOT A DATE";
            break;
        }
        var outputNode = this.srcNodeRef || this.domNode;
        outputNode.innerHTML = render;
      }

    });
  }
);
