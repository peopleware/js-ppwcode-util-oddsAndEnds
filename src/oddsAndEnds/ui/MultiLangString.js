define(["dojo/_base/declare", "./_MultiLangOutput", "./_MultiLangParent", "dojo/date/locale", "dojo/_base/lang", "dojo/_base/kernel", "../js", "../xml"],
  function(declare, _MultiLangOutput, _MultiLangParent, dateLocale, lang, kernel, js, xml) {

    return declare([_MultiLangOutput], {
      // summary:
      //   Widget that is specially made to represent a i18n string in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //
      //   Every set re-renders.

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // value: String?
      value: null,

      _output: function() {
        // summary:
        //		Produce the data-bound output.
        // tags:
        //		protected

        var outputNode = this.srcNodeRef || this.domNode;
        var cleanValue = this.escapeXml ? xml.escape(this.value, false) : this.value;
        outputNode.innerHTML = (cleanValue || cleanValue === 0 || cleanValue === "0") ? cleanValue : this.missing;
      }

    });
  }
);
