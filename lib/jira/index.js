import { findByClientKey, findByUserAccountId, findElseInsert } from "../models/installation";
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