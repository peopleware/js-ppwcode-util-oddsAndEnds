define(["dojo/_base/declare",  "./_MultiLangBundleParent", "./_MultiLangParent"],
  function(declare, _MultiLangBundleParent, _MultiLangParent) {

    return declare([_MultiLangBundleParent], {
      // summary:
      //   This widget shows (not-editable) a `value` in an i18n-ed way,
      //   and for which the representation language can change.
      //   `lang` is the locale, which can change. `value` is what is shown.
      //   Setting anything re-renders.
      // description:
      //   If `lang` does not have a meaningful value, we look upwards in the widget
      //   tree for a value _MultiLangParent, and use its `lang`.
      //   Missing values are rendered as the `missingLabel`, found by `getLabel` (see `_MultiLangBundleParent`),
      //   if `missingLabel` is filled out. Otherwise `missing` is used.
      //
      //   If bindLang is true (the default), we bind lang on startup to the lang of a _MultiLangBundleParent,
      //   if there is one.
      //
      //   All locales must be defined as extraLocale in dojoConfig.

      // value: *?
      value: null,

      // missing: string
      //   This string is used when there is no value to show, if there is no `missinglabel`.
      missing: "?value?",

      // missingLabel: String
      //   The label of the missing message, defined in an nls bundle.
      //   `getLabel` (see `_MultiLangParent`) must be able to find the label.
      missingLabel: null,

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
          if (parentWb && parentWb.isInstanceOf(_MultiLangParent)) {
            return parentWb;
          }
          return parent(parentWb);
        }

        var self = this;
        var parentWb = parent(self); // TODO do something with own
        if (parentWb) {
          self._parentLangHandle = parentWb.watch("lang", function(propName, oldValue, newValue) {
            if (oldValue !== newValue) {
              self.set("lang", newValue);
            }
          });
        }
      },

      _setBindLangAttr: function(value) {
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

      _getMissingAttr: function() {
        return this.missingLabel ?
          this.getLabel(this.missingLabel) :
          (this.missing || this.missing === "") ? this.missing : 'N/A';
      },

      _output: function(){
        // summary:
        //		Produce the value-bound output.
        // tags:
        //		protected

        this._c_ABSTRACT();
      }

    });
  }
);
