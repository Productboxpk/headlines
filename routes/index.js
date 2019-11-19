import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jiraApi";
import { createToken } from "../lib/middlewares";
import { Installations } from "../db";

export default function routes(app, addon) {
    app.post("/installed", async (req, res, next) => {
        console.log("Received installation payload");
        const { clientKey, oauthClientId, publicKey, sharedSecret, baseUrl, eventType } = req.body;
        await Installations.create({
            client_key: clientKey,
            oauth_client_id: oauthClientId,
            public_key: publicKey,
            shared_secret: sharedSecret,
            jira_host: baseUrl,
            event_type: eventType
        }).catch(err => {
            console.log(err, "save err");
            return res.sendStatus(500);
        });
        next();
        return res.sendStatus(204);
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", addon.checkValidToken(), async (req, res, next) => {
        // let clientKey;
        // await Installations.findAll({
        //     where: {
        //         jira_host: hostBaseUrl
        //     }
        // })
        //     .then(data => {
        //         clientKey = data[0].dataValues.client_key;
        //     })
        //     .catch(err => console.log("Failed to get data", err));

        console.log(req, "jwt");
        var httpClient = addon.httpClient(req);
        let allProjectKeys = [];
        let projectKeys = req.query.projectKey;
        let userIssues = [];
        const { userAccountId } = req.context;

        projectKeys = projectKeys && projectKeys.length && projectKeys.split(",");

        if (_.isEmpty(allProjectKeys)) {
            try {
                const data = await getAllProjects(userAccountId, httpClient);
                allProjectKeys = _.map(data, k => k.key);
            } catch (err) {
                console.log(err, "Error is here");
            }
        }

        if (_.isEmpty(projectKeys)) projectKeys = allProjectKeys;

        if (projectKeys.length === 1) {
            try {
                let data = await getAllProjectIssues(userAccountId, projectKeys, httpClient);
                userIssues = [...userIssues, ...data];
            } catch (err) {
                console.log(err, "Error is here");
            }
        } else {
            try {
                for (let i = 0; i <= projectKeys.length - 1; i++) {
                    let data = await getAllProjectIssues(userAccountId, projectKeys[i], httpClient);
                    userIssues = [...userIssues, ...data];
                }
            } catch (err) {
                console.log(err, "Error is here");
            }
        }
        try {
            for (let i = 0; i <= userIssues.length - 1; i++) {
                if (userIssues[i].histories.length && userIssues[i].histories[0].from) {
                    const accountId =
                        userIssues[i].histories.length && userIssues[i].histories[0].from;
                    userIssues[i].histories[0].avatars = await getUserByAccountId(
                        userAccountId,
                        accountId,
                        httpClient
                    );
                }
            }
        } catch (err) {
            console.log(err, "Error is here");
        }

        userIssues = _.sortBy(userIssues, i => {
            return i.fields.updated;
        });

        userIssues = _.reverse(userIssues);

        res.render("headlines", {
            title: "Issues",
            data: userIssues,
            projects: allProjectKeys
        });
    });
}
