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

define(["crypto-js/sha256", "crypto-js/enc-base64", "./jwt"], function(sha256, encBase64, jwt) {

  /**
   * @typedef {Object} PkceCouple
   * @property {string} verifier
   * @property {string} challenge
   */

  /**
   * Create a PKCE verifier and challenge.
   *
   * Depends on https://github.com/brix/crypto-js being defined as `crypto-js` package in the AMD setup. This library
   * is a processed version of the Google JavaScript Crypto-JS library. See also
   * https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js
   *
   * The `challenge` must be send as `code_challenge` with `code_challenge_method=S256` as query parameters in the
   * initial OAuth2 authorization code flow `authorize` call (along with 'response_type=code', the `client_id`,
   * `redirect_uri`, and `state`, and possibly others). The `verifier` must be send as `code_verifier` as query
   * parameter when requesting a token with the `code` returned from the `authorize` from the `token` endpoint
   * (along with 'grant_type=authorization_code', the `client_id`, `redirect_uri`, `code`, and possibly others).
   *
   * The `verifier` is a random string, containing only characters allowed in a PKCE, of length `length`. For PKCE,
   * the length must be at least 43, and maximum 128. The `challenge` is the `base64url` of the SHA256 of the
   * `verifier`. `base64url` is `base64` (`btoa`), not padded with '=', and with '-' instead of '+', and
   * '_' instead of '/'.
   *
   * Creating a working PKCE has proven terribly problematic. Almost all code on the internet is for Nodejs, and
   * _works_, but it is very difficult to find example code for the browser. We cannot use standard dojo(x) support,
   * because
   *
   * - `dojox/encoding/base64` is stupid, because browsers support `atob()`, and `dojox/encoding/base64` does not help
   *    with base64url, nor unicode
   * - `dojox/encoding/digests/SHA256` does strange stuff, that never lead to a working result (all variants tried)
   *
   * The biggest issue seems to be that SHA256 and `base64url` work on bytes, and not characters (which are Unicode
   * in JavaScript, and not bytes).
   *
   * This code is based on
   * https://tonyxu.io/posts/2018/oauth2-pkce-flow/#generate-pkce-code-verifier-and-code-challenge-online
   *
   * @param {number} length
   * @returns {PkceCouple}
   */
  function pkce(length) {
    function generateRandomString(length) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }

    function base64URL(string) {
      return string
        .toString(encBase64)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }

    var verifier = generateRandomString(length);

    return {
      verifier: verifier,
      challenge: base64URL(sha256(verifier))
    }
  }

  /**
   * @typedef {Object} Id
   * @property {string} token_use
   * @property {string} sub
   * @property {number} exp
   * @property {number} iat
   * @property {string} email
   * @property {boolean} email_verified
   * @property {string} name
   */

  /**
   * Is `jwt` a valid OIDC IdToken payload object, at the `sBefore` seconds before now?
   *
   * @param {Jwt} jwt
   * @param {number=} sBefore
   * @returns {boolean}
   */
  function isValidId(id, sBefore) {
    return jwt.isValid(id, sBefore) &&
           id.token_use === "id" &&
           typeof id.email === "string" &&
           typeof id.email_verified &&
           typeof id.name === "string";
  }

  return {
    isValidId: isValidId,
    pkce: pkce
  };
});
