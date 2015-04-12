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
      //   Create a new generator each time you need to generate a row, or reset after each row generation,
      //   to avoid memory leaks. Set the semantic object before calling `generate`, e.g., in the constructor:
      //   | var listRowNode = new MySemanticObjectTypeListGenerator({semanticObject: mySemanticObject}).generate();
      //
      //   During generation, a `div` is created as listRow DOMNode, with inside it an upper- and lower label.
      //   These are also available as properties after generation, and removed by `reset`.
      //
      //   Subclasses are often used in different contexts, where more or less information should be shown.
      //   Showing more or less information can best be handled by adding "show yes or no"-boolean properties.
      //   The default should always be to show everything. By setting some properties to false in the constructor
      //   using the kwargs-object, less can be shown. This is the sensible default, because less information
      //   should be shown in more specific contexts, where at construction time we know the context we are in,
      //   and it is easy to make the choice explicit, and this can be done statically.

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRow".
      listRowClassName: "listRow",

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRowIdentifyingField".
      upperLabelClassName: "listRowIdentifyingField",

      // listRowClassName: String
      //   The general CSS class name to use for listRows. The default is "listRowBottomRightMinor".
      lowerLabelClassName: "listRowBottomRightMinor",

      secondaryLabelClassName: "listRowSecondary",

      // semanticObject: SemanticObject
      //   The SemanticObject to create a listRow for.
      semanticObject: null,

      // listRowNode: DOMNode
      //    The generated listRow DOMNode
      listRowNode: null,

      // upperLabelNode: DOMNode
      //    DOMNode of the upper label, after generation.
      upperLabelNode: null,

      // upperLabelSecondaryNode: DOMNode
      //    DOMNode of the upper label, second line, after generation.
      upperLabelSecondaryNode: null,

      // lowerLabelNode: DOMNode
      //    DOMNode of the lower label, after generation.
      lowerLabelNode: null,

      // forceUpperLabelSecondaryNode: Boolean
      //   When false, if `upperLabelSecondaryText` returns null or the empty string,
      //   there will be no `upperLabelSecondaryNode`. When true, there will always be
      //   an `upperLabelSecondaryNode`, which is empty if `upperLabelSecondaryText`
      //   returns null or the empty string,
      forceUpperLabelSecondaryNode: false,

      constructor: function(kwargs) {
        if (kwargs) {
          lang.mixin(this, kwargs);
        }
      },

      createLabel: function(/*String*/ className,
                            /*String*/ text,
                            /*String[]?*/ extraClassNames,
                            /*DOMNOde*/ parentNode,
                            /*Boolean*/ forceEmptyNode) {
        // className: String
        //   the main CSS class name
        // extraClassNames: String[]
        //   optional array of CSS class names to be applied to the label too
        this._c_pre(function() {return !!parentNode;});

        var thereIsText = text || text === "0" || text === "false";
        if (!forceEmptyNode && !thereIsText) {
          return;
        }
        // we want a node in any case; there is text, or we need to force an empty node
        var attributes = {className: [className]};
        if (extraClassNames) {
          attributes.className = attributes.className.concat(extraClassNames);
        }
        attributes.className = attributes.className.join(" ");
        if (thereIsText) {
          attributes.textContent = text;
        }
        //noinspection JSValidateTypes,UnnecessaryLocalVariableJS
        var /*DOMNode*/ label = domConstruct.create("div", attributes, parentNode);
        return label; // return DOMNode
      },

      createUpperLabel: function() {
        this._c_pre(function() {return !!this.listRowNode;});
        this._c_pre(function() {return !this.upperLabelNode;});

        this.upperLabelNode = this.createLabel(
          this.upperLabelClassName,
          this.upperLabelText(),
          this.upperLabelExtraClassNames(),
          this.listRowNode,
          true
        );
        this.upperLabelSecondaryNode = this.createLabel(
          this.secondaryLabelClassName,
          this.upperLabelSecondaryText(),
          null,
          this.upperLabelNode,
          this.forceUpperLabelSecondaryNode
        );
      },

      createLowerLabel: function() {
        this._c_pre(function() {return !!this.listRowNode;});
        this._c_pre(function() {return !this.lowerLabelNode;});

        this.lowerLabelNode = this.createLabel(
          this.lowerLabelClassName,
          this.lowerLabelText(),
          this.lowerLabelExtraClassNames(),
          this.listRowNode,
          true
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

      upperLabelSecondaryText: function() {
        // summary:
        //   Upper label secondary text is optional. There will be no node if this returns `null`, and a block
        //   with this text if it returns a text.
        //   Override to supply the string to show in the upper label secondary position.
        this._c_pre(function() {return !!this.semanticObject;});

        return null;
      },

      lowerLabelText: function() {
        // summary:
        //   Lower label text is optional. There will always be a lower label, but it might not contain a text node.
        //   Override to supply the string to show in the lower label. If this returns `null`, there will be no
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
      },

      reset: function() {
        // summary:
        //   Reset the references to the created DOM nodes to null.
        //   The references to "input" data and "configuration" data, such as css class names and the `semanticObject`
        //   are not touched.
        this.listRowNode = null;
        this.upperLabelNode = null;
        this.upperLabelSecondaryNode = null;
        this.lowerLabelNode = null;
      },

      generateFor: function(/*SemanticObject*/ semanticObject) {
        // summary:
        //   Sets the semantic object, calls generate and remembers the result, resets this, and returns the result.
        //   Since this is the most-used pattern, introduced for convenience.

        this.semanticObject = semanticObject;
        var result = this.generate();
        this.reset();
        return result;
      }

    });

    ListRowGenerator.mid = module.id;

    return ListRowGenerator;

  });
