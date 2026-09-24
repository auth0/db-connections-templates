'use strict';

// mongodb@5.x bundles whatwg-url which requires TextEncoder/TextDecoder as globals.
// Jest 21's jsdom environment does not expose these, so polyfill from Node's util module.
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
