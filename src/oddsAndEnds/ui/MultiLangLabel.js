define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/kernel", "dojo/i18n", "../xml"],
  function(declare, _WidgetBase, kernel, i18n, xml) {

    return declare([_WidgetBase], {
      // summary:
      //   Widget that is specially made to represent a i18n (nls) label in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //   We need to set
      //   - nlsParentDirectory: the directory containing the used nls directory
      //   - bundle: the name of the i18n file
      //   - label: the name of the property in that file to show
      //   - lang; the locale, which can change
      //
      //   All locales must be defined as extraLocale in dojoConfig.
      //   The actual i18n resource must be loaded using the i18n! plugin syntax.
      //
      //   Missing labels are rendered as `missing`.
      //   The label is xml-escaped by default.
      //
      //   Every set re-renders.

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // nlsParentDirectory: String?
      nlsParentDirectory: null,

      // bundle: String?
      bundle: null,

      // label: String?
      label: null,

      lang: kernel.locale, // default language is browser dependent

      postCreate: function() {
        this._output();
      },

      set: function(name, value){
        // summary:
        //		Override and refresh output on value change.
        // name:
        //		The property to set.
        // value:
        //		The value to set in the property.
        this.inherited(arguments);
        if (this._created) {
          this._output();
        }
      },

      _output: function(){
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var render = this.missing;
        if (this.nlsParentDirectory && this.bundle && this.label) {
          try {
            var labels = i18n.getLocalization(this.nlsParentDirectory, this.bundle, this.lang || kernel.locale);
            render = labels[this.label];
          }
          catch (err) {
            console.info("INFO error while getting (" + this.nlsParentDirectory + "/nls/" + this.bundle + ")." +
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
