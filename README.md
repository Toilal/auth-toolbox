# Auth Toolbox

*The developer toolbox for REST Authentication.*

Auth Toolbox is a set of TypeScript modules that can be used to implement REST client authentication.

### Features

#### Supported HTTP client

Auth Toolbox supports the following HTTP clients:
  
 - XMLHttpRequest
 - axios
 - request (Todo)
 - JQuery (Todo)
 - Angular (Todo)
 
Any other client may be implemented.
 
#### Supported protocols

Auth Toolbox supports the following protocols out of the box:

 - OAuth 2.0 Password Grant (Access Token + Refresh token)
 - OpenID Discovery (`.well-known/openid-configuration` endpoint)

Any custom implementation matching OAuth 2.0 Password Grant flow may be implemented.
