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

define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/kernel", "dojo/i18n", "../js", "../xml", "../log/logger!"],
  function(declare, _WidgetBase, kernel, i18n, js, xml, logger) {

    function parentDirFromMid(mid) {
      var parts = mid.split("/");
      parts.pop();
      return parts.join("/");
    }

    var _MultiLangAnchorParent = declare([_WidgetBase], {
      // summary:
      //   Widget mixin that makes the widget an parent anchor point for the language used
      //   by multi-language widget children.
      //   Multi-language widget children bind to the lang property of their
      //   closest enclosing parent widget of this type at startup (and only then). When the
      //   language of an instance of this type changes, the languages of all
      //   registered child multi-language widgets changes too.
      //
      //   Furthermore, instances of this type define
      //   a `nlsParentDirectory` and a `bundleName`, which together identify a
      //   common bundle for the bound multi-language child widgets.
      //
      //   With all this in place, instances can return an exact label,
      //   given a name of a label in the referred to bundle.
      //
      //   All used locales must be defined as extraLocale in dojoConfig.

      // lang: String
      //   Default: kernel.locale.
      lang: kernel.locale,

      // nlsParentDirectory: String?
      //  This default is directory of the widget instance's class, if a property
      //  `mid` with the module id was defined on its constructor.
      nlsParentDirectory: null,

      // bundleName: String?
      bundleName: null,

      constructor: function(kwargs) {
        if (kwargs && kwargs.nlsParentDirectory) {
          this.nlsParentDirectory = kwargs.nlsParentDirectory;
        }
        else if (!this.nlsParentDirectory && this.constructor.mid) {
          this.nlsParentDirectory = parentDirFromMid(this.constructor.mid);
        }
      },

      bindChildLang: function(/*_WidgetBase*/ child) {
        // summary:
        //   Returns a watch handle for that updates `child.get("lang")` when this.lang changes,
        //   and sets `child.get("lang")` to the current lang of this.

        var handle = this.watch("lang", function(propName, oldValue, newValue) {
          if (oldValue !== newValue) {
            child.set("lang", newValue);
          }
        });
        child.set("lang", this.get("lang"));
        return handle;
      },

      getLabel: function(/*String*/ labelName, /*String?*/ lang, /*Boolean?*/ escapeXml, /*Object?*/ otherContext, /*String?*/ otherBundleName) {
        // summary:
        //   Return the string for `labelName` from the standard bundle referred to by this (or another)
        //   in the language `this.lang` (or another), escaped for XML (or not).
        //   On the string retrieved from the bundle, ${}-replacement is done. This replacement employs
        //   Stateful `get` when present.
        // labelName: String
        //   The name of the label to return the string for.
        // lang: String?
        //   By default the language to return a label for is this.lang. But, this can be used to override that.
        // escapeXml: Boolean?
        //   Whether or not to escapeXml the retrieved label. Default is true.
        // otherContext: Object?
        //   Optional. ${}-replacement is done in the context of `this`, except
        //   when this object is provided to use as context instead.
        // otherBundleName: String?
        //   Optional. Use otherBundleName instead of this.nlsParentDirectory and this.bundleName if provided.
        //   This is the path to the bundle, without "nls" or the language directory, and can be relative.

        var render = "?" + labelName + "?";
        var nlsParentDir;
        var bundleName;
        if (otherBundleName) {
          var parts = otherBundleName.split("/");
          bundleName = parts.pop();
          nlsParentDir = parts.join("/");
          if (nlsParentDir.charAt(0) === ".") { // relative
            // now we need a this.constructor.mid!
            if (!this.constructor.mid) {
              throw "ERROR: using a relative path to another bundle requires a this.constructor.mid";
            }
            nlsParentDir = parentDirFromMid(this.constructor.mid) + "/" + nlsParentDir;
          }
          if (!bundleName || !nlsParentDir) {
            throw "ERROR: trouble parsing otherBundleName '" + otherBundleName + "'";
          }
        }
        else {
          nlsParentDir = this.get("nlsParentDirectory");
          if (!nlsParentDir) {
            throw "ERROR: no nlsParentDirectory defined for " + this;
          }
          bundleName = this.get("bundleName");
          if (!bundleName) {
            throw "ERROR: no bundleName defined for " + this;
          }
        }
        var actualLang = lang || this.get("lang") || kernel.locale;
        try {
          var labels = i18n.getLocalization(nlsParentDir, bundleName, actualLang);
          render = labels[labelName];
          if (js.typeOf(render) === "string") {
            try {
              var substContext = otherContext || this;
              render = js.substitute(render, substContext);
            }
            catch (err) {
              logger.warn("${}$-replacement failed on '" + render + "' while getting (" +
                nlsParentDir + "/nls/" + bundleName + ")." + labelName + " for locale '" + lang +
                "'-- rendering '" + render + "'", err);
            }
          }
        }
        catch (err) {
          logger.warn("error while getting (" + nlsParentDir + "/nls/" + bundleName + ")." +
            labelName + " for locale '" + lang + "'-- rendering '" + render + "'", err);
        }
        return (escapeXml !== false) ? xml.escape(render, false) : render;
      }

    });

    _MultiLangAnchorParent.findEnclosing = function(/*_WidgetBase*/ w) {
      // summary:
      //   Returns the closest enclosing parent widget of type _MultiLangAnchorParent.
      //   This is a direct or indirect parent of `w`, but never `w` itself.
      //   If no such parent widget is found, null is returned.

      var parent = w && w.getParent();
      return parent && parent.isInstanceOf(_MultiLangAnchorParent) ? parent : _MultiLangAnchorParent.findEnclosing(parent);
    };

    return _MultiLangAnchorParent;
  }
);
