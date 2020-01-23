import { findByUserAccountId, findElseInsert } from "../models/installation";
import { Installations } from "../../db";
import * as _ from "lodash";
const oauth2 = require('atlassian-oauth2');

export const token = async (clientKey, userAccountId) => {
    try {
        let data = null;
        if (clientKey) {
            data = await findElseInsert(Installations, { clientKey }, userAccountId)
        } else {
            data = await findByUserAccountId(Installations, userAccountId);
        }
        const { oauthClientId, sharedSecret, baseUrl } = data.data;
        const options = {
            hostBaseUrl: baseUrl,
            oauthClientId: oauthClientId,
            userAccountId,
            scopes: ["READ", "ACT_AS_USER"],
            sharedSecret: sharedSecret
        };
        const authToken = await oauth2.getAccessToken(options)
        await Installations.update({
            jira_token: authToken.access_token
        }, { where: { account_id: userAccountId } })
        const updatedClient = await findByUserAccountId(Installations, userAccountId);
        return { accessToken: authToken.access_token, updatedClient };
    } catch (error) {
        return error;
    }
};

export const connect = async (req, res, next) => {
    const isHttps = req.secure || req.header("x-forwarded-proto") === "https";

    return res.status(200).json({
        apiMigrations: {
            gdpr: true
        },
        name: "Headlines for Jira",
        description:
            "This plugin shows the recent updated tickets and branches of all projects a user is working on",
        key: "headlines-jira",
        baseUrl: `${isHttps ? "https" : "http"}://${req.get("host")}`,
        lifecycle: {
            installed: "/jira/events/install",
            uninstalled: "/jira/events/uninstall",
            enabled: "/jira/events/enable",
            disabled: "/jira/events/disable"
        },
        vendor: {
            name: "Productbox",
            url: "https://www.productbox.dev"
        },
        authentication: {
            type: "jwt"
        },
        scopes: ["READ", "ACT_AS_USER"],
        apiVersion: 1,
        modules: {
            generalPages: [
                {
                    key: "headlines",
                    location: "system.top.navigation.bar",
                    name: {
                        value: "Headlines"
                    },
                    url: "/headlines",
                    conditions: [
                        {
                            condition: "user_is_logged_in"
                        }
                    ]
                }
            ]
        }
    });
};