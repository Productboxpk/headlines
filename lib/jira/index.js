import { findByClientKey } from "../models/installation";
import { Installations } from "../../db";

const request = require("request"),
    RSVP = require("rsvp"),
    jwt = require("atlassian-jwt");

const EXPIRE_IN_SECONDS = 60,
    AUTHORIZATION_SERVER_URL = "https://auth.atlassian.io",
    JWT_CLAIM_PREFIX = "urn:atlassian:connect",
    GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer",
    SCOPE_SEPARATOR = " ";

export const token = async (req, res, next) => {
    let userAccountId, clientKey;
    if (req.query.jwt) {
        const { sub, iss } = jwt.decode(req.query.jwt, "", true);
        userAccountId = sub;
        clientKey = iss;
    }

    // console.log(clientKey, userAccountId);

    const data = await findByClientKey(Installations, clientKey);
    // console.log(data, "data");

    const { oauthClientId, sharedSecret, baseUrl } = data.data;

    const options = {
        hostBaseUrl: baseUrl,
        oauthClientId: oauthClientId,
        userAccountId: data.account_id || userAccountId,
        scopes: ["READ", "ACT_AS_USER"],
        sharedSecret: sharedSecret
    };

    // console.log(options, "options");

    const accessTokenData = await getAccessToken(options).catch(err =>
        console.log(err, "Token err")
    );

    // console.log(accessTokenData, "accessTokenData");

    await Installations.findByPk(clientKey)
        .then(async client => {
            await client
                .update({
                    jira_token: accessTokenData,
                    account_id: userAccountId
                })
                .then(updated => {
                    // console.log(updated, 'updated')
                    req.session.clientData = updated;
                });
        })
        .catch(err => {
            console.log(err, "token save err");
        });
    // console.log("at the end");
    return accessTokenData;
};

function getAccessToken(opts) {
    opts = opts || {};
    return new RSVP.Promise(function(resolve, reject) {
        var jwtClaims;
        if (opts.userAccountId) {
            jwtClaims = _createAAIDAssertingPayload(
                opts.hostBaseUrl,
                opts.oauthClientId,
                opts.userAccountId,
                opts.authorizationServerBaseUrl
            );
        } else if (opts.userKey) {
            jwtClaims = _createUserKeyAssertionPayload(
                opts.hostBaseUrl,
                opts.oauthClientId,
                opts.userKey,
                opts.authorizationServerBaseUrl
            );
        } else {
            reject("No user identifier (userKey or userAccountId) provided");
        }

        var assertion = jwt.encode(jwtClaims, opts.sharedSecret);

        var formData = {
            grant_type: GRANT_TYPE,
            assertion: assertion
        };

        if (opts.scopes) {
            formData.scope = opts.scopes.join(SCOPE_SEPARATOR).toUpperCase();
        }

        request(
            {
                method: "POST",
                url:
                    (opts.authorizationServerBaseUrl || AUTHORIZATION_SERVER_URL) +
                    (opts.authorizationPath || "/oauth2/token"),
                form: formData,
                json: true,
                headers: {
                    accept: "application/json"
                }
            },
            function(err, response, body) {
                if (err) {
                    reject(err);
                } else if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(body);
                } else {
                    resolve(body);
                }
            }
        );
    });
}

function _createGenericAssertionPayload(hostBaseUrl, oauthClientId, subClaim, audience) {
    var now = Math.floor(Date.now() / 1000);
    var exp = now + EXPIRE_IN_SECONDS;

    return {
        iss: JWT_CLAIM_PREFIX + ":clientid:" + oauthClientId,
        tnt: hostBaseUrl,
        sub: subClaim,
        aud: audience || AUTHORIZATION_SERVER_URL,
        iat: now,
        exp: exp
    };
}

function _createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, userKey, audience) {
    var subClaim = JWT_CLAIM_PREFIX + ":userkey:" + userKey;
    return _createGenericAssertionPayload(hostBaseUrl, oauthClientId, subClaim, audience);
}

function _createAAIDAssertingPayload(hostBaseUrl, oauthClientId, aAID, audience) {
    var subClaim = JWT_CLAIM_PREFIX + ":useraccountid:" + aAID;
    return _createGenericAssertionPayload(hostBaseUrl, oauthClientId, subClaim, audience);
}
