define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/kernel"],
  function(declare, _WidgetBase, kernel) {

    var _MultiLangLabelParent = declare([_WidgetBase], {
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

      lang: kernel.locale, // default language is browser dependent

      _getNlsParentDirectoryAttr: function() {
        if ((!this.nlsParentDirectory) && this.constructor.mid) {
          this.set("nlsParentDirectory", _MultiLangLabelParent.dirFromMid(this.constructor.mid));
        }
        return this.nlsParentDirectory;
      }

    });

    _MultiLangLabelParent.dirFromMid = function(mid) {
      // summary:
      //   Helper function to get the directory from a MID
      var parts = mid.split("/");
      parts.pop();
      return parts.join("/");
    };

    return _MultiLangLabelParent;
  }
);
