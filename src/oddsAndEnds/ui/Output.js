define(["../../../dojo/_base/declare",
        "dojox/mvc/Output",
        "../xml"],
  function(declare, DojoxMvcOutput, xml) {

    return declare([DojoxMvcOutput], {
      // summary:
      //   Widget based on dojox/mvc/Output. The only difference
      //   is that the shown text is xml-escaped before it is put
      //   in the HTML.

      // missing: string
      //   This string is used when there is no value to show.
      missing: "?value?",
      // TODO re-render when missing changes

      postCreate: function() {
        this._output();
      },

      _output: function(){
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected
        var outputNode = this.srcNodeRef || this.domNode;
        var output = this.templateString ? this._exprRepl(this.templateString) : this.value;
        outputNode.innerHTML = xml.escape(output, false, this.missing);
      }

    });
  }
);
