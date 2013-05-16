define(["dojo/_base/declare",
        "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/Stateful", "dojo/number", "dojo/_base/lang",
  "dojo/text!./widget.html", "dojo/i18n", "module",
        "dojo/i18n!./nls/labels",
        "dojox/mvc/at", "dojox/mvc/Group", "../../ui/Output", "dijit/form/TextBox"],
  function(declare,
           WidgetBase, TemplatedMixin, WidgetsInTemplateMixin,
           Stateful, number, lang,
           template, i18n, module) {

    return declare([WidgetBase, TemplatedMixin, WidgetsInTemplateMixin], {

      templateString: template,

      // ./nls/labels
      labels: null,

      // target: viewmodel/Data
      //   Data object of the product documents viewmodel
      target: null,

      postMixInProperties: function() {
        var labels = i18n.getLocalization("ppwcode/oddsAndEnds/test/changeLang", "labels", this.lang);
        this.labels = labels; // cannot use set in postMixInProperties yet
      },

      _setLangAttr: function(value) {
        this._set("lang", value);
        var labels = i18n.getLocalization("ppwcode/oddsAndEnds/test/changeLang", "labels", value);
        this.set("labels", labels);
        if (this.get("target")) {
          var old = this.get("target").get("aNumber");
          this.get("target").set("aNumber", null);
          this.get("target").set("aNumber", old);
          // note:
          //   Triggering a re-render of a binding is next to impossible.
          //   In dojox/mvc/sync, there is a test for the old value to be different from the new value,
          //   before it makes an attempt to re-render.
          //   Since on language change, the value does not differ, but only its representation,
          //   there is no re-rendering.
          //   This should be considered a bug. A workaround is to change the value to another value
          //   twice.
          //
          //   But then again, we cannot do this on immutable objects.
          //
          //   Second, we need to do this for i18n-dependent representations.
          //   How do we find those? List them here explicitly?
          //
          //   It will be better to set the value of the widgets ourselfs, converted.
          //   But in that case, how do we get at the converter?
        }
      },

      aNumberConverter: function() {
        // note:
        //   This converter is here solely because the options that we define in the template
        //   or created and locked on widget instance construction.
        //   A language in the template constraints property this is locked. Even if we write
        //   "locale: this.lang", it still will be locked to the value of this.lang when the
        //   template is evaluated (construction of the widget).
        //   So, this converter sets the locale in the options passed to the number.format
        //   and number.parse to this.lang at the moment of execution.
        //   A second problem is that it is not easy to get at this.lang, i.e., at this.
        //   The this of the execution of format and parse is a temp object, whose "source"
        //   property is the TextBox, and whose target property is the Target.
        //   Setting the lang of this does _not_ change the lang of the nested TextBox (it is
        //   set at construction to the the value of our lang).
        //   One way would be to propagate the setting of lang to our children. The formatter
        //   could then use this.lang (this being the TextBox).
        //   The other way is to encapsulate the converter in a function, like we do here,
        //   to defined a "self = this", to acces the lang later.
        var self = this;
        return {
          format: function(double, options) {
            if (!double && (double !== 0)) {
              return options && options.na ? options.na : 'N/A';
            }
            else {
              var opt = lang.clone(options);
              opt.locale = self.lang;
              return number.format(double, opt);
            }
          },
          parse: function(str, options) {
            if (!str || str === (options && options.na ? options.na : 'N/A')) {
              return null;
            }
            else {
              // with options.places, we need to supply str with this exact decimal places!!! 0's aren't added, number isn't truncated
              var opt = lang.clone(options);
              delete opt.places;
              opt.locale = self.lang;
              var d = number.parse(str, opt);
              return d;
            }
          }
        }
      }

    });

  }
);
