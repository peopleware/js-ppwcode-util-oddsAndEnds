define(["dojo/number", "dojo/_base/lang", "dojo/i18n"],
  function(dojoNumber, lang, i18n) {

    /*=====
     number.__FormatOptions = declare(null, {
     // pattern: String?
     //		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
     //		with this string.  Default value is based on locale.  Overriding this property will defeat
     //		localization.  Literal characters in patterns are not supported.
     // type: String?
     //		choose a format type based on the locale from the following:
     //		decimal, scientific (not yet supported), percent, currency. decimal by default.
     // places: Number?
     //		fixed number of decimal places to show.  This overrides any
     //		information in the provided pattern.
     // round: Number?
     //		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
     //		means do not round.
     // locale: String?
     //		override the locale used to determine formatting rules
     // fractional: Boolean?
     //		If false, show no decimal places, overriding places and pattern settings.
     // group: String?
     //   This string is used as group separator instead of the locale defined symbol, if given.
     });
     =====*/

    // summary:
    //   We take over the dojo/number functionality, to add the possibility in formatting to change the group
    //   symbol. It is possible to add a String "group" property to the FormatOptions
    var number = lang.delegate(dojoNumber, {

      format: function(/*Number*/ value, /*number.__FormatOptions?*/ options) {
        // summary:
        //		Format a Number as a String, using locale-specific settings
        // description:
        //		Create a string from a Number using a known localized pattern.
        //		Formatting patterns appropriate to the locale are chosen from the
        //		[Common Locale Data Repository](http://unicode.org/cldr) as well as the appropriate symbols and
        //		delimiters.
        //		If value is Infinity, -Infinity, or is not a valid JavaScript number, return null.
        // value:
        //		the number to be formatted

        options = lang.mixin({}, options || {});
        var locale = i18n.normalizeLocale(options.locale),
          bundle = i18n.getLocalization("dojo.cldr", "number", locale);
        options.customs = bundle || {};
        var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
        if (options.group) {
          options.customs.group = options.group;
        }
        if(isNaN(value) || Math.abs(value) == Infinity){ return null; } // null
        return this._applyPattern(value, pattern, options); // String
      }

    });

    return number;
  }
);
