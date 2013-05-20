define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/kernel"],
  function(declare, _WidgetBase, kernel) {

    var _MultiLangParent = declare([_WidgetBase], {
      // summary:
      //   Optional parent for _MultiLangOutput. Instances of _MultiLangOutput might
      //   bind to the `lang` of instances of this type.
      //
      //   All locales must be defined as extraLocale in dojoConfig.

      lang: kernel.locale // default language is browser dependent

    });

    return _MultiLangParent;
  }
);
