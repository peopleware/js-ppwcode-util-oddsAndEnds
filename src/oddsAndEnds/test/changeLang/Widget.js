define(["dojo/_base/declare",
        "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/number", "dojo/_base/lang", "dojox/mvc/resolve", "dojo/aspect",
        "dojo/text!./widget.html", "dojo/i18n", "require",
        "dojo/i18n!./nls/labels",
        "dojox/mvc/at", "dojox/mvc/Group", "../../ui/Output", "dijit/form/TextBox"],
  function(declare,
           WidgetBase, TemplatedMixin, WidgetsInTemplateMixin,
           number, lang, resolve, aspect,
           template, i18n, require) {

    function getParent(/*dijit/_WidgetBase*/ w){
      // summary:
      //		Returns parent widget having data binding target for relative data binding.
      // w: dijit/_WidgetBase
      //		The widget.

      // Usage of dijit/registry module is optional. Return null if it's not already loaded.
      var registry;
      try{
        registry = require("dijit/registry");
      }catch(e){
        return null;
      }
      var pn = w.domNode && w.domNode.parentNode, pw, pb;
      while(pn){
        pw = registry.getEnclosingWidget(pn);
        if(pw){
          var relTargetProp = pw._relTargetProp || "target", pt = lang.isFunction(pw.get) ? pw.get(relTargetProp) : pw[relTargetProp];
          if(pt || relTargetProp in pw.constructor.prototype){
            return pw; // dijit/_WidgetBase
          }
        }
        pn = pw && pw.domNode.parentNode;
      }
      return null;
    }

    // Monkey patch dijit._WidgetBase._setLangAttr to refresh bound values
    aspect.after(WidgetBase.prototype, "_setLangAttr", function(result) {
      if (this._refs) {
        for (var prop in this._refs) {
          if (prop != "lang") {
            var binding = this._refs[prop];
            var converter = binding.converter;
            if (converter && converter.format) {
              var parent = getParent(this);
              var relModelProp = parent && parent._relTargetProp || "target";
              var relModel = parent && parent.get(relModelProp);
              var resolvedModel = resolve(binding.target, relModel);
              if (resolvedModel) {
                var converterInstance = {source: resolvedModel, target: this};
                var formatFunc = lang.hitch(converterInstance, converter.format);
                var constraints = lang.mixin({}, this.constraints, resolvedModel.constraints);
                var currentValue = resolvedModel.get(binding.targetProp);
                var convertedValue = formatFunc.call(converterInstance, currentValue, constraints);
                this.set(prop, convertedValue);
              }
            }
          }
        }
      }
      return result;
    });

    return declare([WidgetBase, TemplatedMixin, WidgetsInTemplateMixin], {

      templateString: template,

      // ./nls/labels
      labels: null,

      // target: viewmodel/Data
      //   Data object of the product documents viewmodel
      target: null,

      postMixInProperties: function() {
        var labels = i18n.getLocalization("ppwcode.util.oddsAndEnds/test/changeLang", "labels", this.lang);
        this.labels = labels; // cannot use set in postMixInProperties yet
      },

      _setLangAttr: function(value) {
        this.inherited(arguments);
        var labels = i18n.getLocalization("ppwcode.util.oddsAndEnds/test/changeLang", "labels", value);
        this.set("labels", labels);
      },

      aNumberConverter: {
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

        // note:
        //   Now we have cycles:
        //   source.aNumber = PI
        //   change lang
        //   we reset to PI
        //   format cuts to 3 places
        //   this change in text box triggers event
        //   parse to number 3.145
        //   this is set on source
        //   this change triggers format
        //   "3.145" is set again

        //   the equals method should compare formatted version, not numbers

        format: function(d, options) {
          if (!d && (d !== 0)) {
            return (options && (options.na || options.na === "")) ? options.na : 'N/A';
          }
          else {
            var opt = lang.clone(options);
            opt.locale = this.target.lang;
            return number.format(d, opt);
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
            opt.locale = this.target.lang;
            var d = number.parse(str, opt);
            return d;
          }
        }
      }

    });

  }
);
