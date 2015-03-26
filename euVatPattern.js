/*
Copyright 2015 - $Date $ by PeopleWare n.v.

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

define([],
  function() {

    var euVatPatterns = {
      // summary:
      //   Grep patterns for VAT numbers in the EU.
      //   Source: http://ec.europa.eu/taxation_customs/vies/faq.html#item_11

      AT: {pattern: "U[0-9]{8}", name: "Austria"},
      BE: {pattern: "[0-9]{10}", name: "Belgium"},
      BG: {pattern: "[0-9]{9,10}", name: "Bulgaria"},
      CY: {pattern: "[0-9]{8}[A-Z]", name: "Cyprus"},
      CZ: {pattern: "[0-9]{8,10}", name: "Czech"},
      DE: {pattern: "[0-9]{9}", name: "Germany"},
      DK: {pattern: "[0-9]{8}", name: "Denmark"},
      EE: {pattern: "[0-9]{9}", name: "Estonia"},
      EL: {pattern: "[0-9]{9}", name: "Greece"},
      ES: {pattern: "[A-Z0-9][0-9]{7}[A-Z0-9]", name: "Spain"},
      FI: {pattern: "[0-9]{8}", name: "Finland"},
      FR: {pattern: "[A-Z]{2}[0-9]{9}", name: "France"},
      GB: {pattern: "[0-9]{9}|[0-9]{12}|GD[0-9]{3}|HA[0-9]{3}", name: "United Kingdom"},
      HR: {pattern: "[0-9]{11}", name: "Croatia"},
      HU: {pattern: "[0-9]{8}", name: "Hungary"},
      IE: {pattern: "[0-9][A-Z0-9\\+\\*][0-9]{5}[A-Z]|[0-9]{7}WI", name: "Ireland"},
      IT: {pattern: "[0-9]{11}", name: "Italy"},
      LT: {pattern: "[0-9]{9}|[0-9]{12}", name: "Lithuania"},
      LU: {pattern: "[0-9]{8}", name: "Luxembourg"},
      LV: {pattern: "[0-9]{11}", name: "Latvia"},
      MT: {pattern: "[0-9]{8}", name: "Malta"},
      NL: {pattern: "[0-9]{9}B[0-9]{2}", name: "The Netherlands"},
      PL: {pattern: "[0-9]{10}", name: "Ploand"},
      PT: {pattern: "[0-9]{9}", name: "Portugal"},
      RO: {pattern: "[0-9]{2,10}", name: "Romania"},
      SE: {pattern: "[0-9]{12}", name: "Sweden"},
      SI: {pattern: "[0-9]{8}", name: "Slovenia"},
      SK: {pattern: "[0-9]{10}", name: "Slovakia"}
    };


    // euVatPattern: RegExp
    //   Pattern that matches any EU VAT number, prefixed by the country code, e.g., BE0453834195.
    //   There should be no diacriticals in the VAT number.
    //   Properties are the pattern per country code, and a global pattern without country code in `withoutCountryCode`.
    //   Each country code pattern also has a `withoutCountryCode` property, that holds the pattern of that country
    //   without the country code, and a `countryName` property, that holds the name of the country in English.
    var euVatPattern = new RegExp(
      Object.keys(euVatPatterns).reduce(
        function(acc, countryCode) {return acc + "|" + countryCode + euVatPatterns[countryCode].pattern;},
        ""
      )
    );

    // euVatPattern.withoutCountryCode: RegExp
    //   Pattern that matches any EU VAT number, without the country code, e.g., 0453834195.
    //   There should be no diacriticals in the VAT number. Only exludes highly irregular structures, since
    //   the patterns are not matched to a country.
    euVatPattern.withoutCountryCode = new RegExp(
      Object.keys(euVatPatterns).reduce(
        function(acc, countryCode) {return acc + "|" + euVatPatterns[countryCode].pattern;},
        ""
      )
    );

    Object.keys(euVatPatterns).forEach(
      function(countryCode) {
        euVatPattern[countryCode] = new RegExp(countryCode + euVatPatterns[countryCode].pattern);
        euVatPattern[countryCode].withoutCountryCode = new RegExp(euVatPatterns[countryCode].pattern);
        euVatPattern[countryCode].countryName = euVatPatterns[countryCode].name;
      }
    );

    return euVatPattern;
  }
);
