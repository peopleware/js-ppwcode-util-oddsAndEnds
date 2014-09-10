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

define(["dojo/_base/declare", "./MultiLangFormatOutput", "dojo/date/locale"],
  function(declare, MultiLangFormatOutput, dateLocale) {

    return declare([MultiLangFormatOutput], {
      // summary:
      //   Widget that is specially made to represent a i18n date in a template,
      //   when multiple languages must be shown, and the language can change dynamically.
      //
      //   Every set re-renders.

      // value: Date?
      value: null,

      format: function(/*Value*/ value, /*Object*/ options) {
        return dateLocale.format(value, options);
      }

    });
  }
);
