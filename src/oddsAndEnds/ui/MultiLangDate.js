define(["dojo/_base/declare", "./_MultiLangOutput", "./_MultiLangParent", "dojo/date/locale", "dojo/_base/lang", "dojo/_base/kernel", "../js"],
  function(declare, _MultiLangOutput, _MultiLangParent, dateLocale, lang, kernel, js) {

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
            options.locale = this._lookUpInWidgetHierarchy("lang", _MultiLangParent) || kernel.locale;
            render = dateLocale.format(this.value, options);
            break;
          case "null":
          case "undefined":
            render = this.missing;
            break;
          default:
            render = "NOT A DATE";
            break;
        }
        var outputNode = this.srcNodeRef || this.domNode;
        outputNode.innerHTML = render;
      }

    });
  }
);
