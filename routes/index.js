import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jira";
import { authorizeApp, getCurrentUser, getCurrentUserOrganizations, get } from "../lib/api/github";
import { Installations } from "../db";
import { findAndUpdateElseInsert } from "../lib/models/installation";
import { token } from "../lib/jira";

export default function routes(app, addon) {
    app.post("/installed", async (req, res, next) => {
        req.session.clientKey = req.body.clientKey;
        await findAndUpdateElseInsert(Installations, req.body);
        return res.sendStatus(200);
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", async (req, res, next) => {
        const { access_token: jiraAccessToken } = await token(req, res, next);

        process.env.jira_client_key = req.session.clientData.clientKey;

        let allProjectKeys = [];
        let projectKeys = req.query.projectKey;
        let repoNames = req.query.repoNames;
        let userIssues = [];

        let accessToken;
        let gitHubData = [];
        let allRepoNames = [];

        if (!_.isEmpty(req.session.clientData && req.session.clientData.github_access_token)) {
            let orgsReposData = [];
            accessToken = req.session.clientData.github_access_token;

            const { data: orgs } = await getCurrentUserOrganizations(accessToken);
            for (let i = 0; i <= orgs.length - 1; i++) {
                const { data } = await get(accessToken, orgs[i].repos_url);
                orgsReposData = [...orgsReposData, ...data];
            }
            if (_.isEmpty(repoNames)) {
                for (let i = 0; i <= orgsReposData.length - 1; i++) {
                    const branchLink = orgsReposData[i].branches_url.slice(0, -9);
                    let commitLink = orgsReposData[i].commits_url.slice(0, -6);
                    allRepoNames.push(orgsReposData[i].name);

                    let { data: branchesData } = await get(accessToken, branchLink);

                    let commitsData = [];

                    for (let j = 0; j <= branchesData.length - 1; j++) {
                        let { data: commits } = await get(
                            accessToken,
                            commitLink + "?sha=" + branchesData[j].commit.sha
                        );
                        commits = { [branchesData[j].name]: commits };
                        commitsData = [...commitsData, commits];
                    }
                    _.map(commitsData, commits => {
                        _.mapValues(commits, (value, key) => {
                            commitsData = _.map(value, v => {
                                return {
                                    repo: {
                                        name: orgsReposData[i].name,
                                        owner: {
                                            name: orgsReposData[i].owner.login,
                                            avatarUrl: orgsReposData[i].owner.avatar_url
                                        }
                                    },
                                    branchName: key,
                                    message: v.commit.message,
                                    committer: {
                                        avatarUrl: v.committer && v.committer.avatar_url,
                                        name:
                                            (v.committer && v.committer.login) ||
                                            v.commit.committer.name,
                                        id: v.committer && v.committer.id,
                                        type: v.committer && v.committer.type
                                    },
                                    date: v.commit.committer.date
                                };
                            });
                            gitHubData = [...gitHubData, ...commitsData];
                        });
                    });
                }
                repoNames = allRepoNames;
            } else {
                for (let i = 0; i <= orgsReposData.length - 1; i++) {
                    allRepoNames.push(orgsReposData[i].name);
                    if (_.includes(repoNames, orgsReposData[i].name)) {
                        const branchLink = orgsReposData[i].branches_url.slice(0, -9);
                        let commitLink = orgsReposData[i].commits_url.slice(0, -6);

                        let { data: branchesData } = await get(accessToken, branchLink);

                        let commitsData = [];

                        for (let j = 0; j <= branchesData.length - 1; j++) {
                            let { data: commits } = await get(
                                accessToken,
                                commitLink + "?sha=" + branchesData[j].commit.sha
                            );
                            commits = { [branchesData[j].name]: commits };
                            commitsData = [...commitsData, commits];
                        }
                        _.map(commitsData, commits => {
                            _.mapValues(commits, (value, key) => {
                                commitsData = _.map(value, v => {
                                    return {
                                        repo: {
                                            name: orgsReposData[i].name,
                                            owner: {
                                                name: orgsReposData[i].owner.login,
                                                avatarUrl: orgsReposData[i].owner.avatar_url
                                            }
                                        },
                                        branchName: key,
                                        message: v.commit.message,
                                        committer: {
                                            avatarUrl: v.committer.avatar_url,
                                            name: v.committer.login,
                                            id: v.committer.id,
                                            type: v.committer.type
                                        },
                                        date: v.commit.committer.date
                                    };
                                });
                                gitHubData = [...gitHubData, ...commitsData];
                            });
                        });
                    }
                }
            }
        }

        projectKeys = projectKeys && projectKeys.length && projectKeys.split(",");

        if (_.isEmpty(allProjectKeys)) {
            try {
                const data = await getAllProjects(
                    jiraAccessToken,
                    req.session.clientData.data.baseUrl
                );
                allProjectKeys = _.map(data, k => k.key);
            } catch (err) {
                console.log(err, "Error is here");
            }
        }

        if (_.isEmpty(projectKeys)) projectKeys = allProjectKeys;

        if (projectKeys.length === 1) {
            try {
                let data = await getAllProjectIssues(
                    jiraAccessToken,
                    req.session.clientData.data.baseUrl,
                    projectKeys
                );
                userIssues = [...userIssues, ...data];
            } catch (err) {
                console.log(err, "Error is here");
            }
        } else {
            try {
                for (let i = 0; i <= projectKeys.length - 1; i++) {
                    let data = await getAllProjectIssues(
                        jiraAccessToken,
                        req.session.clientData.data.baseUrl,
                        projectKeys[i]
                    );
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
                        jiraAccessToken,
                        req.session.clientData.data.baseUrl,
                        accountId
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

        gitHubData = _.sortBy(gitHubData, commit => {
            return commit.date;
        });
        gitHubData = _.reverse(gitHubData);

        res.render("headlines", {
            title: "Headlines",
            data: userIssues,
            projects: allProjectKeys,
            gitHubData: gitHubData,
            repoNames: allRepoNames,
            showGithubUrl: _.isEmpty(accessToken),
            jiraAccessToken: jiraAccessToken
        });
    });

    app.get("/github/oauth/redirect", async (req, res, next) => {
        console.log(req.query, "request");
        console.log(req.query.code, "request Token");
        const requestToken = req.query.code;

        const accessToken = await authorizeApp(requestToken);

        // testing token
        const { status } = await getCurrentUser(accessToken);

        if (status == 200) {
            await Installations.findByPk(process.env.jira_client_key)
                .then(client => {
                    client
                        .update({
                            github_access_token: accessToken
                        })
                        .then(data => {
                            res.redirect(
                                `${data.jira_host}/plugins/servlet/ac/jira-git-headlines/headlines`
                            );
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
