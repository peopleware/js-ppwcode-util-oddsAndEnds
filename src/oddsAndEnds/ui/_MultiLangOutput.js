define(["dojo/_base/declare",  "dijit/_WidgetBase", "./_MultiLangParent"],
  function(declare, _WidgetBase, _MultiLangParent) {

    return declare([_WidgetBase], {
      // summary:
      //   This widget is a superclass for widgets that show (not-editable) a `value` in an i18n-ed way,
      //   and for which the representation language can change.
      //   `lang` is the locale, which can change. `value` is what is shown.
      //   Setting anything re-renders.
      //
      //   If `lang` does not have a meaningful value, we look upwards in the widget
      //   tree for a value _MultiLangParent, and use its `lang`.
      //   Missing values are rendered as `missing`.
      //
      //   If bindLang is true (the default), we bind lang on startup to the lang of a _MultiLangParent,
      //   if there is one.
      //
      //   All locales must be defined as extraLocale in dojoConfig.

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",

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

      _lookUpInWidgetHierarchy: function(/*String*/ propName, /*Function*/ Type) {
        // summary:
        //   Lookup a meaningful value for `propName` up in the widget hierarchy,
        //   in instances of `Type`, starting at this.
        //   If no meaningful value is found, undefined is returned (although null, 0,
        //   false, and empty strings might have been encountered).

        function lookup(/*_WidgetBase*/ wb) {
          if (!wb) {
            return undefined;
          }
          var result;
          if (wb.isInstanceOf(Type)) { // this is too
            result = wb.get(propName);
          }
          return result || lookup(wb.getParent());
        }

        return lookup(this);
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
