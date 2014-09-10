/*
Copyright 2012 - $Date $ by PeopleWare n.v.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

define(["dojo/_base/declare", "dijit/_WidgetBase",
        "./_MultiLangAnchorParent", "ppwcode-util-oddsAndEnds/log/logger!"],
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

      // bundleName: String?
      //   Optional. Use bundleName instead of the bundle defined in the closest enclosing _MultiLangAnchorParent
      //   if provided. This is a path, which can be relative to the closest enclosing _MultiLangAnchorParent,
      //   without the "nls" and language directory.
      bundleName: null,

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
        if (this._anchorParentLangHandle) {
          this._anchorParentLangHandle.remove();
          this._anchorParentLangHandle = null;
        }
        this.inherited(arguments);
      },

      getLabel: function(/*String*/ labelName, /*String?*/ lang, /*Boolean?*/ escapeXml) {
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

        return this._anchorParent && this._anchorParent.getLabel(labelName, lang, escapeXml, null, this.bundleName);
      }

    });
  }
);
