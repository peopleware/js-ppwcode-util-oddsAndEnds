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

define([], function() {

  /**
   * Get the payload is JavaScript object from a JWT token. This does not verify the token.
   *
   * A token consists of 3 parts, separated by a '.'. The middle part is the payload.
   * The parts are a base64url version of a JSON object, in Unicode. base64url is a variant of base64. A base64url
   * string is not padded with '=', and has '-' instead of '+', and '_' instead of '/'. These symbols have to be
   * replaced before the a standard `atob` can be applied. The decoded string then has to be converted to Unicode,
   * and parsed as JSON.
   *
   * This solution is based on https://stackoverflow.com/a/47574303/4580818.
   *
   * @param {string} token
   * @returns {Object}
   */
  function payload(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    var json = decodeURIComponent(
      Array.prototype.map.call(
        atob(base64),
        function(c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }
      ).join("")
    );
    return JSON.parse(json);
  }


  return {
    payload: payload
  };
});
