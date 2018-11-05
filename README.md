# Auth Toolbox

[![NPM Package](https://img.shields.io/npm/v/auth-toolbox.svg)](https://www.npmjs.com/package/auth-toolbox)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://img.shields.io/travis/Toilal/auth-toolbox.svg)](https://travis-ci.org/Toilal/auth-toolbox)
[![Coverage Status](https://coveralls.io/repos/github/Toilal/auth-toolbox/badge.svg?branch=master)](https://coveralls.io/github/Toilal/auth-toolbox?branch=master)
[![devDependencies Status](https://david-dm.org/Toilal/auth-toolbox/dev-status.svg)](https://david-dm.org/Toilal/auth-toolbox?type=dev)

*The developer toolbox for HTTP Client Authentication.*

Auth Toolbox is a set of TypeScript modules that can be used to add HTTP Client authentication to your application.

`Auth` class provides methods like `login()` and `logout()`, and can be constructed with various adapters 
to support any HTTP Client and any HTTP Server.

### Features

#### Supported HTTP Clients

Auth Toolbox supports the following HTTP Clients:
  
 - XMLHttpRequest
 - axios
 - request (Todo)
 - JQuery (Todo)
 - Angular (Todo)
 
Any other client may be implemented.
 
#### Supported HTTP Servers protocols

Auth Toolbox supports the following protocols out of the box:

 - OAuth 2.0 Password Grant (Access Token + Refresh token)
 - OpenID Discovery (`.well-known/openid-configuration` endpoint)

Any custom implementation matching OAuth 2.0 Password Grant flow may be implemented.

### Credits

 - TypeScript library template generated from [alexjoverm/typescript-library-starter](https://github.com/alexjoverm/typescript-library-starter).
