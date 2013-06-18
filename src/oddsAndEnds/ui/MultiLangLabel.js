define(["dojo/_base/declare", "./_MultiLangOutput", "./_MultiLangBundleParent", "dojo/_base/kernel", "dojo/i18n", "../xml"],
  function(declare, _MultiLangOutput, _MultiLangBundleParent, kernel, i18n, xml) {

    return declare([_MultiLangOutput, _MultiLangBundleParent], {
      // summary:
      //   Widget that is specially made to represent a i18n (nls) label in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //   We need to set
      //   - nlsParentDirectory: the directory containing the used nls directory
      //   - bundleName: the name of the i18n file
      //   - label: the name of the property in that file to show
      //   - lang; the locale, which can change
      //
      //   If any of these are not a meaningful value, we look upwards in the widget
      //   tree for a value _MultiLangBundleParent, and use its values.
      //
      //   If bindLang is true (the default), we bind lang on startup to the lang of a parent, if there is one.
      //
      //   All locales must be defined as extraLocale in dojoConfig.
      //   The actual i18n resource must be loaded using the i18n! plugin syntax.
      //
      //   Missing labels are rendered as `missing`.
      //   The label is xml-escaped by default.
      //
      //   Every set re-renders.

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // label: String?
      label: null,

      _output: function() {
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var render = this.missing;
        var nlsParentDir = this._lookUpInWidgetHierarchy("nlsParentDirectory", _MultiLangBundleParent);
        var bundle = this._lookUpInWidgetHierarchy("bundleName", _MultiLangBundleParent);
        var lang = this._lookUpInWidgetHierarchy("lang", _MultiLangBundleParent) || kernel.locale;
        if (nlsParentDir && bundle && this.label) {
          try {
            var labels = i18n.getLocalization(nlsParentDir, bundle, lang);
            render = labels[this.label];
          }
          catch (err) {
            console.info("INFO error while getting (" + this.nlsParentDirectory + "/nls/" + this.bundleName + ")." +
              this.label + " for locale '" + this.lang + "': " + err.message + " -- rendering missing ('" + this.missing + "')");
          }
        }
        var outputNode = this.srcNodeRef || this.domNode;
        var cleanValue = this.escapeXml ? xml.escape(render, false) : render;
        outputNode.innerHTML = (cleanValue || cleanValue === 0 || cleanValue === "0") ? cleanValue : this.missing;
      }

    });
  }
);
