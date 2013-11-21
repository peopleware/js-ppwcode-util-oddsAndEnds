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

define(["dojo/_base/declare", "./_MultiLangOutput"],
  function(declare, _MultiLangOutput) {

    return declare([_MultiLangOutput], {
      // summary:
      //   Widget that is specially made to represent a i18n (nls) label in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //   We need to set
      //   - nlsParentDirectory: the directory containing the used nls directory
      //   - bundleName: the name of the i18n file
      //   - label: the name of the property in that file to show
      //   - lang; the locale, which can change
      //
      //   If any of these are not a meaningful value, we look upwards in the widget
      //   tree for a value _MultiLangBundleParent, and use its values.
      //
      //   If bindLang is true (the default), we bind lang on startup to the lang of a parent, if there is one.
      //
      //   All locales must be defined as extraLocale in dojoConfig.
      //   The actual i18n resource must be loaded using the i18n! plugin syntax.
      //
      //   Missing labels are rendered as `missing`.
      //   The label is xml-escaped by default.
      //
      //   Every set re-renders.

      // escapeXml: Boolean
      //   Default is true.
      escapeXml: true,

      // label: String?
      label: null,

      _output: function() {
        // summary:
        //		Produce the data-bound output, xml-escaped.
        // tags:
        //		protected

        var render = this.label ? this.getLabel(this.label, null, this.escapeXml) : this.get("missing");
        var outputNode = this.srcNodeRef || this.domNode;
        outputNode.innerHTML = (render || render === 0 || render === "0") ? render : this.missing;
      }

    });
  }
);
