define(["dojo/_base/declare", "ppwcode-util-contracts/_Mixin",
        "dojo/dom-construct", "dojo/_base/lang",
        "module",
        "xstyle/css!./listRow.css"],
  function(declare, _ContractsMixin,
           domConstruct, lang,
           module) {

    var ListRowGenerator = declare([_ContractsMixin], {
      // summary:
      //   Instances can be used to generate a listRow object for a SemanticObject.
      //   Generate creates a new div, each time it is called. See listRow.css for styling.
      // description:
      //   This is an abstract class. Methods to get the text for the upper and lower label need to be filled out
      //   for subclasses or instances.
      //
      //   Create a new generator each time you need to generate a row, to avoid memory leaks. Set the semantic
      //   object before calling `generate`, e.g., in the constructor:
      //   | var listRowNode = new MySemanticObjectTypeListGenerator({semanticObject: mySemanticObject}).generate();
      //
      //   During generation, a `div` is created as listRow DOMNode, with inside it an upper- and lower label.
      //   These are also available as properties after generation.

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRow".
      listRowClassName: "listRow",

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRowIdentifyingField".
      upperLabelClassName: "listRowIdentifyingField",

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRowBottomRightMinor".
      lowerLabelClassName: "listRowBottomRightMinor",

      // semanticObject: SemanticObject
      //   The SemanticObject to create a listRow for.
      semanticObject: null,

      // listRowNode: DOMNode
      //    The generated listRow DOMNode
      listRowNode: null,

      // upperLabelNode: DOMNode
      //    DOMNode of the upper label, after generation.
      upperLabelNode: null,

      // lowerLabelNode: DOMNode
      //    DOMNode of the lower label, after generation.
      lowerLabelNode: null,

      constructor: function(kwargs) {
        if (kwargs) {
          lang.mixin(this, kwargs);
        }
      },

      createLabel: function(/*String*/ className,
                            /*String*/ text,
                            /*String[]?*/ extraClassNames) {
        // className: String
        //   the main CSS class name
        // extraClassNames: String[]
        //   optional array of CSS class names to be applied to the label too
        this._c_pre(function() {return !!this.listRowNode;});

        var attributes = {className: [className]};
        if (extraClassNames) {
          attributes.className = attributes.className.concat(extraClassNames);
        }
        attributes.className = attributes.className.join(" ");
        if (text || text === "0" || text === "false") {
          attributes.textContent = text;
        }
        //noinspection JSValidateTypes,UnnecessaryLocalVariableJS
        var /*DOMNode*/ upperLabel = domConstruct.create("div", attributes, this.listRowNode);
        return upperLabel; // return DOMNode
      },

      createUpperLabel: function() {
        this._c_pre(function() {return !!this.listRowNode;});
        this._c_pre(function() {return !this.upperLabelNode;});

        this.upperLabelNode = this.createLabel(
          this.upperLabelClassName,
          this.upperLabelText(),
          this.upperLabelExtraClassNames()
        );
      },

      createLowerLabel: function() {
        this._c_pre(function() {return !!this.listRowNode;});
        this._c_pre(function() {return !this.lowerLabelNode;});

        this.lowerLabelNode = this.createLabel(
          this.lowerLabelClassName,
          this.lowerLabelText(),
          this.lowerLabelExtraClassNames()
        );
      },

      extraClassNames: function() { // TODO chain
        // summary:
        //   Override to return an array of extra CSS class names to add to the listRow of
        //   `this.semanticObject`, if appropriate.
        this._c_pre(function() {return !!this.semanticObject;});

        return []; // String[]
      },

      upperLabelText: function() {
        // summary:
        //   Override to supply the string to show in the upper label.
        this._c_pre(function() {return !!this.semanticObject;});

        return this._c_ABSTRACT(); // return String
      },

      upperLabelExtraClassNames: function() { // TODO chain
        // summary:
        //   Override to return an array of extra CSS class names to add to the upper label for the listRow of
        //   `this.semanticObject`, if appropriate.
        "use strict";
        this._c_pre(function() {return !!this.semanticObject;});

        return []; // String[]
      },

      lowerLabelText: function() {
        // summary:
        //   Lower label text is optional. There will always be a lower label, but it might not contain a text node.
        //   Override to supply the string to show in the upper label. If this returns `null`, there will be no
        //   text node.
        this._c_pre(function() {return !!this.semanticObject;});

        return null;
      },

      lowerLabelExtraClassNames: function() { // TODO chain
        // summary:
        //   Override to return an array of extra CSS class names to add to the lower label for the listRow of
        //   `this.semanticObject`, if appropriate.
        "use strict";
        this._c_pre(function() {return !!this.semanticObject;});

        return []; // String[]
      },

      generate: function() {
        // summary:
        //   Generate a div that can be used as a dgrid List row.
        this._c_pre(function() {return !!this.semanticObject;});
        // TODO abstract precondition for correct type, to allow for downcast
        this._c_pre(function() {return !this.listRowNode;});
        this._c_pre(function() {return !this.upperLabelNode;});
        this._c_pre(function() {return !this.lowerLabelNode;});

        var classNames = [this.listRowClassName];
        var extraClassNames = this.extraClassNames();
        if (extraClassNames) {
          classNames = classNames.concat(extraClassNames);
        }
        classNames = classNames.join(" ");
        //noinspection JSValidateTypes
        this.listRowNode = domConstruct.create("div", {className: classNames});
        this.createUpperLabel();
        this.createLowerLabel();
        return this.listRowNode; // return DOMNode
      }
    });

    ListRowGenerator.mid = module.id;

    return ListRowGenerator;

  });
