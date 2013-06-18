define(["dojo/_base/declare", "./_MultiLangParent", "dojo/i18n", "ppwcode/oddsAndEnds/xml"],
  function(declare, _MultiLangParent, i18n, xml) {

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

      getLabel: function(labelName, escapeXml, /*String?*/ otherBundleName) {
        // summary:
        // otherBundleName: String?
        //   Optional. Use otherBundleName instead of this.bundleName if provided.

        var render = "?" + labelName + "?";
        var nlsParentDir = this.get("nlsParentDirectory");
        var bundleName = otherBundleName || this.get("bundleName");
        if (nlsParentDir && bundleName && labelName) {
          try {
            var labels = i18n.getLocalization(nlsParentDir, bundleName, this.get("lang"));
            render = labels[labelName];
          }
          catch (err) {
            console.info("INFO error while getting (" + nlsParentDir + "/nls/" + bundleName + ")." +
              labelName + " for locale '" + this.lang + "': " + (err.message || err));
          }
        }
        return (!escapeXml) ? render : xml.escape(render, false);
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
