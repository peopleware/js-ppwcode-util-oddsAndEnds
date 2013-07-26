define(["dojo/_base/declare", "./_MultiLangParent", "dojo/_base/kernel", "dojo/i18n", "ppwcode/oddsAndEnds/xml", "../log/logger!"],
  function(declare, _MultiLangParent, kernel, i18n, xml, logger) {

    var _MultiLangBundleParent = declare([_MultiLangParent], {
      // summary:
      //   Optional parent for MultiLangParent. We can set
      //   - nlsParentDirectory: the directory containing the used nls directory
      //   - bundleName: the name of the i18n file
      //   - lang; the locale, which can change
      //
      //   All locales must be defined as extraLocale in dojoConfig.
      //   The actual i18n resource must be loaded using the i18n! plugin syntax.
      //
      //   If nlsParentDirectory is not set, we see if we have a `mid` property on the Constructor.
      //   If so, we derive it from that, and cache it.

      // nlsParentDirectory: String?
      nlsParentDirectory: null,

      // bundleName: String?
      bundleName: null,

      _getNlsParentDirectoryAttr: function() {
        if ((!this.nlsParentDirectory) && this.constructor.mid) {
          this.set("nlsParentDirectory", _MultiLangBundleParent.dirFromMid(this.constructor.mid));
        }
        return this.nlsParentDirectory;
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

      findLang: function() {
        return this._lookUpInWidgetHierarchy("lang", _MultiLangParent) || kernel.locale;
      },

      getLabel: function(/*String*/ labelName, /*String?*/ lang, /*Boolean?*/ escapeXml, /*String?*/ otherBundleName) {
        // summary:
        // escapeXml: Boolean?
        //   Whether or not to escapeXml the retrieved label. Default is true.
        // otherBundleName: String?
        //   Optional. Use otherBundleName instead of this.bundleName if provided.

        var render = "?" + labelName + "?";
        var nlsParentDir = this._lookUpInWidgetHierarchy("nlsParentDirectory", _MultiLangBundleParent);
        var bundleName = otherBundleName || this._lookUpInWidgetHierarchy("bundleName", _MultiLangBundleParent);
        var actualLang = lang || this.findLang();
        if (nlsParentDir && bundleName && labelName) {
          try {
            var labels = i18n.getLocalization(nlsParentDir, bundleName, actualLang);
            render = labels[labelName];
          }
          catch (err) {
            logger.warn("error while getting (" + nlsParentDir + "/nls/" + bundleName + ")." +
              labelName + " for locale '" + lang + "'-- rendering '" + render + "'", err);
          }
        }
        else {
          logger.warn("could not find nlsParentDir (" + nlsParentDir + ") or bundle (" + bundleName + ") for label (" +
            labelName + "): -- rendering '" + render + "'");
        }
        return (escapeXml !== false) ? xml.escape(render, false) : render;
      }

    });

    _MultiLangBundleParent.dirFromMid = function(mid) {
      // summary:
      //   Helper function to get the directory from a MID
      var parts = mid.split("/");
      parts.pop();
      return parts.join("/");
    };

    return _MultiLangBundleParent;
  }
);
