# Auth Toolbox

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
