define(["dojo/_base/declare", "./MultiLangFormatOutput", "dojo/date/locale"],
  function(declare, MultiLangFormatOutput, dateLocale) {

    return declare([MultiLangFormatOutput], {
      // summary:
      //   Widget that is specially made to represent a i18n date in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //
      //   Every set re-renders.

      // value: Date?
      value: null,

      format: function(/*Value*/ value, /*Object*/ options) {
        return dateLocale.format(value, options);
      }

    });
  }
);
