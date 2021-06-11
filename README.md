# Auth Toolbox

[![NPM Package](https://img.shields.io/npm/v/auth-toolbox.svg)](https://www.npmjs.com/package/auth-toolbox)
![npm type definitions](https://img.shields.io/npm/types/auth-toolbox.svg)
[![Build Status](https://img.shields.io/github/workflow/status/Toilal/auth-toolbox/ci)](https://github.com/Toilal/auth-toolbox/actions?query=workflow%3Aci)
[![Coverage Status](https://coveralls.io/repos/github/Toilal/auth-toolbox/badge.svg?branch=master)](https://coveralls.io/github/Toilal/auth-toolbox?branch=master)
[![devDependencies Status](https://david-dm.org/Toilal/auth-toolbox/dev-status.svg)](https://david-dm.org/Toilal/auth-toolbox?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![GitHub stars](https://img.shields.io/github/stars/Toilal/auth-toolbox.svg?style=social&label=Stars)](https://github.com/Toilal/auth-toolbox)

*The developer toolbox for HTTP Client Authentication.*

Auth Toolbox is a set of JavaScript modules that can be used to add HTTP Client Authentication 
to your web application.

It's designed to support any HTTP Client, and any Authorization Server supporting OpenID Connect 
/ OAuth 2.0 *Resource Owner Password Credentials Grant*. Any custom similar workflows with 
username/password credentials authentication providing an Access Token may be supported 
(like PHP Symfony's [lexik/LexikJWTAuthenticationBundle](https://github.com/lexik/LexikJWTAuthenticationBundle) + 
[gesdinet/jwt-refresh-token-bundle](https://github.com/gesdinet/JWTRefreshTokenBundle)).

### Disclaimer

This kind of authentication method is commonly discouraged for web applications, but it may be 
acceptable for simple applications where Authentication Server and Resource Owner is implemented in
the same service, or if the Authentication Server is dedicated to the application.

You should read this [excellent post by Scott Brady](https://www.scottbrady91.com/OAuth/Why-the-Resource-Owner-Password-Credentials-Grant-Type-is-not-Authentication-nor-Suitable-for-Modern-Applications)
about why you should not use Password Grant authentication. As a more secure alternative, you could 
use [oidc-client](https://github.com/IdentityModel/oidc-client-js), but if you really need to avoid 
any redirect to the Authorization Server, you should stick with Auth Toolbox.

### Install

```
npm install auth-toolbox
```

### Examples

#### OpenID Connect Password Grant / OAuth 2.0 Password Grant

 - *Resource Owner Password Credentials Grant (`grant_type=password`)*
 - *Client authentication with id/secret (Basic Auth)*
 - *OpenID Auto configuration throw OpenID Discovery*
 - *Axios adapter*

```typescript
import Auth, { UsernamePasswordCredentials } from 'auth-toolbox/dist/lib/auth-toolbox'
import OpenidConnectAdapter, { openidConnectDiscovery } from 'auth-toolbox/dist/lib/server-adapter/openid-connect-adapter'
import JwtTokenDecoder from 'auth-toolbox/dist/lib/token-decoder/jwt-token-decoder'
import AxiosAdapter from 'auth-toolbox/dist/lib/client-adapter/axios-adapter'

import axios, { AxiosResponse } from 'axios'

// Keycloak is a great opensource Authentication Server
const openIdIssuerUrl = 'https://keycloak.pragmasphere.com/realms/planireza'
const openIdClientId = 'clientId'
const openIdClientSecret = 'ThisIsSecret!'

const client = axios.create()

const axiosAdapter = new AxiosAdapter(
  client,
  { auth: { username: openIdClientId, password: openIdClientSecret } }
)

const auth = new Auth<UsernamePasswordCredentials, AxiosResponse>(
  openidConnectDiscovery(axiosAdapter, openIdIssuerUrl),
  new OpenidConnectAdapter(),
  axiosAdapter,
  { accessTokenDecoder: new JwtTokenDecoder() }
)

auth.login('myUsername', 'myPassword').then(() => {
  // Read the payload from decoded access token
  const payload = auth.decodeAccessToken()
  console.log(payload) // Decoded user payload
  
  // This resource requires user to be authenticated.
  // Axios interceptors have been automatically registered to handle all the authentication stuff.
  return client.get('/restricted')
}).then((r: AxiosResponse) => {
  // We are in !
  console.log(r.data)
})
```

### Docs

[API Documentation is available](https://toilal.github.io/auth-toolbox/)

### Supported HTTP Clients

Auth Toolbox supports the following HTTP Clients:
  
 - axios
 - request (Todo)
 - JQuery (Todo)
 - Angular (Todo)
 - XMLHttpRequest (Todo)
 
Any other client may be implemented.
 
### Supported HTTP Servers protocols

Auth Toolbox supports the following protocols out of the box:

 - OpenID Connect *Resource Owner Password Credentials Grant* (Access Token + Optional Refresh token)
 - OpenID Discovery (`.well-known/openid-configuration` endpoint)

Any custom implementation matching more or less *OAuth 2.0 Password Grant* flow may be implemented.

### Credits

 - TypeScript library template generated from [alexjoverm/typescript-library-starter](https://github.com/alexjoverm/typescript-library-starter).
