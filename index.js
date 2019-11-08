#!/usr/bin/env node

/*
 * A node program demonstrating how to obtain and use a token from the authorization service.
 *
 * Your add-on (and the token) will need the ACT_AS_USER scope, and you will need to be able to access the install data from
 * your add-on service in order to get the required argument values.
 *
 * Note that the userkey is not the same as the username - see the usage message for more info.
 *
 * The OAuth client ID is included in the install hook payload as <tt>oauthClientId</tt>.
 *
 * Requirements: node >= v0.12.2
 * To run (in the same directory as this file):
 *
 * npm install
 * node . [arguments]
 *
 */
const request = require('request'),
    jwt = require('atlassian-jwt');

/********************************
 * CONSTANTS
 ********************************/

var AUTHORIZATION_SERVER_URL = "https://auth.atlassian.io",
    EXPIRY_SECONDS = 10,
    GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer",
    SCOPES = "READ ACT_AS_USER"; // case-sensitive space-delimited as per the specification
                     // (https://tools.ietf.org/html/rfc6749#section-3.3)

/********************************
 * INITIALISE APP
 ********************************/

var app = require('commander');

app
    .option('--oauthClientId <clientId>', 'OAuth Client Id')
    .option('--instanceBaseUrl <baseUrl>', 'Atlassian product instance url')
    .option('--userKey <userKey>', 'User to act as')
    .option('--secret <secret>', 'Shared secret to sign request')
    .parse(process.argv);

var opts = {};

function checkAndSetArgument(name, value, transformer) {
    if (!value) {
        console.log( ("Argument " + name.bold + " is required").red);
        app.help();
    } else {
        opts[name] = transformer ? transformer(value) : value;
    }
}

checkAndSetArgument("oauthClientId", app.oauthClientId);
checkAndSetArgument("instanceBaseUrl", app.instanceBaseUrl, function (v) { return v.stripRight('/').s });
checkAndSetArgument("userKey", app.userKey);
checkAndSetArgument("secret", app.secret);

/********************************
 * CREATE ASSERTION
 ********************************/
console.log("Building JWT Assertion".bold);

var now = Math.floor(Date.now() / 1000),
    exp = now + EXPIRY_SECONDS;

var jwtClaims = {
    iss: "urn:atlassian:connect:clientid:" + opts.oauthClientId,
    sub: "urn:atlassian:connect:userkey:" + opts.userKey,
    tnt: opts.instanceBaseUrl,
    aud: AUTHORIZATION_SERVER_URL,
    iat: now,
    exp: exp
};

var assertion = jwt.encode(jwtClaims, opts.secret);

console.log("Assertion:".yellow, assertion);

/********************************
 * REQUEST ACCESS TOKEN
 ********************************/

var parameters = {
    grant_type: GRANT_TYPE,
    assertion: assertion,
    scope: SCOPES
};

console.log("Requesting access token".bold);

request.post({
    url: AUTHORIZATION_SERVER_URL + '/oauth2/token',
    form: parameters,
    json: true,
    headers: {
        "accept": "application/json"
    }
}, function(err, httpResponse, body) {
    var statusCode = httpResponse.statusCode;
    if (err || statusCode < 200 || statusCode > 299) {
        var error = err || body;
        console.log(("ERROR [" + statusCode + "]").red + ": Couldn't get access token from response", error);
    } else {
        console.log("Token type:".yellow, body.token_type);
        console.log("Access token:".yellow, body.access_token);
        makeRequestAsUser(body.access_token);
    }
});

/********************************
 * REQUEST ACCESS TOKEN
 ********************************/

function makeRequestAsUser(access_token) {
    var testResource = opts.instanceBaseUrl.endsWith("/wiki") ? "/rest/api/user/current" : "/rest/api/latest/myself";
    var fullResourcePath = opts.instanceBaseUrl + testResource;

    console.log(("Making request as user to " + fullResourcePath.green + " as " + opts.userKey.green).bold);

    request.get({
        url: fullResourcePath,
        json: true,
        headers: {
            "Authorization": "Bearer " + access_token,
            "accept": "application/json"
        }
    }, function(err, httpResponse, body) {
        var statusCode = httpResponse.statusCode;
        if (err || statusCode < 200 || statusCode > 299) {
            var error = err || body;
            console.log(("ERROR [" + statusCode + "]").red + ": Couldn't make request as user", error);
        } else {
            console.log(body);
        }
    });
}

