import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jiraApi";
import { Installations } from "../db";
import axios from "axios";

export default function routes(app, addon) {
    app.post("/installed", async (req, res, next) => {
        const { clientKey, oauthClientId, publicKey, sharedSecret, baseUrl, eventType } = req.body;
        req.session.clientKey = clientKey;
        await Installations.findByPk(clientKey)
            .then(client => {
                return client.update({
                    oauth_client_id: oauthClientId,
                    public_key: publicKey,
                    shared_secret: sharedSecret,
                    jira_host: baseUrl,
                    event_type: eventType
                });
            })
            .catch(async err => {
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
            });

        next();
        return res.sendStatus(204);
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", addon.checkValidToken(), async (req, res, next) => {
        const { userAccountId, clientKey } = req.context;
        process.env.jira_client_key = clientKey;

        if (!req.session.clientKey) {
            req.session.clientKey = clientKey;
        }

        var httpClient = addon.httpClient(req);
        let allProjectKeys = [];
        let projectKeys = req.query.projectKey;
        let userIssues = [];

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

    app.get("/github/oauth/redirect", async (req, res, next) => {
        const githubClientID = process.env.client_id;
        const githubClientSecret = process.env.client_secret;
        const requestToken = req.query.code;

        await axios({
            method: "post",
            url: `https://github.com/login/oauth/access_token?client_id=${githubClientID}&client_secret=${githubClientSecret}&code=${requestToken}`,
            headers: {
                accept: "application/json"
            }
        })
            .then(response => {
                req.session.accessToken = response.data.access_token;
                console.log(`/welcome.html?access_token=${req.session.accessToken}`);
            })
            .catch(err => console.log("Access Token error is here", err));

        const { status } = await axios({
            method: "GET",
            url: "https://api.github.com/user",
            headers: {
                Authorization: `token ${req.session.accessToken}`
            }
        });
        if (status == 200) {
            await Installations.findByPk(process.env.jira_client_key)
                .then(client => {
                    client
                        .update({
                            github_access_token: req.session.accessToken
                        })
                        .then(data => {
                            res.redirect(`${data.jira_host}/plugins/servlet/ac/jira-git-headlines/headlines`)
                        }) 
                        .catch(err => console.log("Update err", err));
                })
                .catch(err => console.log("Find err", err));
        }
    });

    app.post("/github/events", (req, res, next) => {
        console.log(req, "Webhook url");
    });

    app.get("/github-setup", (req, res, next) => {
        res.redirect("https://github.com/settings/apps/jira-git-headlines/installations");
    });
}
