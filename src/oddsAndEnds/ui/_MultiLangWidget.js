define(["dojo/_base/declare", "dijit/_WidgetBase",
        "./_MultiLangAnchorParent", "ppwcode/oddsAndEnds/log/logger!"],
  function(declare, _WidgetBase,
           _MultiLangAnchorParent, logger) {

    return declare([_WidgetBase], {
      // summary:
      //   Widget that enables multi-lang representations.
      //   It is to be used as a direct or indirect child widget of a `_MultiLangAnchorParent`.
      // description:
      //   Instances bind on startup to the closest enclosing _MultiLangAnchorParent. When
      //   its language changes, our `lang` changes too.
      //   To get a label, we ask the closest enclosing _MultiLangAnchorParent.
      //
      //   All locales must be defined as extraLocale in dojoConfig.

      // _anchorParent: _MultiLangAnchorParent
      //   The _MultiLangAnchorParent found at startup. We are bound to its lang
      //   with `_anchorParentLangHandle`.
      _anchorParent: null,
      _anchorParentLangHandle: null,

      startup: function() {
        this.inherited(arguments);
        this._anchorParent = _MultiLangAnchorParent.findEnclosing(this);
        if (!this._anchorParent) {
          logger.warn("No _MultiLangAnchorParent found to bind to to for " + this);
          return;
        }
        this._anchorParentLangHandle = this._anchorParent.bindChildLang(this);
      },

      destroy: function() {
        this.inherited(arguments);
        if (this._anchorParentLangHandle) {
          this._anchorParentLangHandle.remove();
          this._anchorParentLangHandle = null;
        }
      },

      getLabel: function(/*String*/ labelName, /*String?*/ lang, /*Boolean?*/ escapeXml, /*Object?*/ otherContext, /*String?*/ otherBundleName) {
        // summary:
        //   Aks for the string for `labelName` from the standard bundle referred to by the closest enclosing
        //   _MultiLangAnchorParent (or another bundle) in the language the closest enclosing
        //   _MultiLangAnchorParent (or another language), escaped for XML (or not).
        // labelName: String
        //   The name of the label to return the string for.
        // lang: String?
        //   By default the language to return a label for is the lang of the closest enclosing _MultiLangAnchorParent.
        //   But, this can be used to override that.
        // escapeXml: Boolean?
        //   Whether or not to escapeXml the retrieved label. Default is true.
        // otherContext: Object?
        //   Optional. ${}-replacement is done in the context of the closest enclosing _MultiLangAnchorParent, except
        //   when this object is provided to use as context instead.
        // otherBundleName: String?
        //   Optional. Use otherBundleName instead of the bundleName of the closest enclosing _MultiLangAnchorParent
        //   if provided.

        return this._anchorParent && this._anchorParent.getLabel(labelName, lang, escapeXml, otherContext, otherBundleName);
      }

    });
  }
);
