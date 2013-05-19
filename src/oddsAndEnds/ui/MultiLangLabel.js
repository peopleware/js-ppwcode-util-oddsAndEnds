define(["dojo/_base/declare", "./_MultiLangLabelParent", "dojo/_base/kernel", "dojo/i18n", "../xml"],
  function(declare, _MultiLangLabelParent, kernel, i18n, xml) {

    return declare([_MultiLangLabelParent], {
      // summary:
      //   Widget that is specially made to represent a i18n (nls) label in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //   We need to set
      //   - nlsParentDirectory: the directory containing the used nls directory
      //   - bundle: the name of the i18n file
      //   - label: the name of the property in that file to show
      //   - lang; the locale, which can change
      //
      //   If any of these are not a meaningful value, we look upwards in the widget
      //   tree for a value _MultiLangLabelParent, and use its values.
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

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // label: String?
      label: null,

      bindLang: true,
      _parentLangHandle: null,

      startup: function() {
        this.inherited(arguments);
        if (this.bindLang) {
          this._bindLang();
        }
        this._output();
      },

      destroy: function() {
        this.inherited(arguments);
        if (this._parentLangHandle) {
          this._parentLangHandle.remove();
          this._parentLangHandle = null;
        }
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

      _bindLang: function() {
        function parent(/*_WidgetBase*/ wb) {
          if (!wb) {
            return null
          }
          var parentWb = wb.getParent();
          if (parentWb.isInstanceOf(_MultiLangLabelParent)) {
            return parentWb;
          }
          return parent(parentWb);
        }

        var self = this;
        var parentWb = parent(self);
        // TODO do something with own
        if (parentWb) {
          self._parentLangHandle = parentWb.watch("lang", function(propName, oldValue, newValue) {
            if (oldValue !== newValue) {
              self.set("lang", newValue);
            }
          });
        }
      },

      _setBindLang: function(value) {
        if (this.bindLang != value) {
          if (this.bindLang && this._parentLangHandle) {
            this._parentLangHandle.remove();
          }
          this._set("bindLang", value);
          if (this.bindLang) {
            this._bindLang();
          }
        }
      },

      _output: function(){
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        function lookup(/*_WidgetBase*/ wb, /*String*/ propName) {
          if (!wb) {
            return null;
          }
          var result;
          if (wb.isInstanceOf(_MultiLangLabelParent)) { // this is too
            result = wb.get(propName);
          }
          return result || lookup(wb.getParent(), propName);
        }

        var render = this.missing;
        var nlsParentDir = lookup(this, "nlsParentDirectory");
        var bundle = lookup(this, "bundle");
        var lang = lookup(this, "lang") || kernel.locale;
        if (nlsParentDir && bundle && this.label) {
          try {
            var labels = i18n.getLocalization(nlsParentDir, bundle, lang);
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
