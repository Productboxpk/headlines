import * as _ from "lodash";
import * as jwt from "atlassian-jwt";
import { Installations, Subscriptions } from "../db";
import { token, connect } from "../lib/jira";
import { authorizeApp, get } from "../lib/api/github";
import { getAllProjects, getAllProjectIssues } from "../lib/api/jira";
import { findAndUpdateElseInsert } from "../lib/models/installation";

let userAccountId = null;

export default function routes(app, addon) {
    app.post("/jira/events/install", async (req, res, next) => {
        const authJWT = req.headers.authorization.slice(4);
        const { sub, iss } = jwt.decode(authJWT, "", true);
        await findAndUpdateElseInsert(Installations, req.body, sub);
        return res.sendStatus(200);
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.post("/jira/events/enable", async (req, res, next) => {
       const updated = await Installations.update(
           { enabled: true },
           { where: { client_key: req.body.clientKey } }
       );
       console.log(updated[0])
       if(updated[0]) return res.sendStatus(200);
       else return res.sendStatus(500);
    });

    app.use("/atlassian-connect.json", connect);

    app.get("/headlines", async (req, res, next) => {
        const requestJwt = req.query && req.query.jwt && jwt.decode(req.query.jwt, "", true) || null;
        userAccountId = requestJwt && requestJwt.sub || null;
        const clientKey = requestJwt && requestJwt.iss !== 'micros/oauth-2-authorization-server' && requestJwt.iss || null;
        const { accessToken: jiraAccessToken, updatedClient: clientData } = await token(clientKey, userAccountId);
        let allProjectKeys = [];
        let projectKeys = req.query.projectKey;
        let repoNames = req.query.repoNames;
        let userIssues = [];
        let githubAccessToken;
        let gitHubData = [];
        const allRepoNames = [];

        let githubDataFromDB;
        if(clientData && clientData.github_installation_id) githubDataFromDB = await Subscriptions.findOne({ where: { github_installation_id: clientData.github_installation_id } });

        if (!_.isEmpty(githubDataFromDB && githubDataFromDB.github_access_token)) {
            githubAccessToken = githubDataFromDB && githubDataFromDB.github_access_token; 
            githubAccessToken = githubDataFromDB.github_access_token;
            const commitsDataPromises = []
            let branchesData = [];
            let commitsData = [];
            
            const allowedRepos = githubDataFromDB.repositories;
            
            if (allowedRepos) {
                const orgsReposDataPromises = _.map(allowedRepos, (org) => { return get(githubAccessToken, `https://api.github.com/repos/${org.full_name}`) }); // full_name is like /organization/repositories
                let orgsData = await Promise.all(orgsReposDataPromises);
                const branchsLink = [];
                const commitsLink = [];
                _.each(orgsData, (orgData) => {
                    allRepoNames.push(orgData.data.name);
                    if (_.isEmpty(repoNames)) {
                        branchsLink.push(orgData.data.branches_url.slice(0, -9));
                        commitsLink.push(orgData.data.commits_url.slice(0, -6));
                    }
                    if (_.includes(repoNames, orgData.data.name)) {
                        branchsLink.push(orgData.data.branches_url.slice(0, -9));
                        commitsLink.push(orgData.data.commits_url.slice(0, -6));
                    }
                });
                const branchDataPromises = _.map(branchsLink, (branchLink) => get(githubAccessToken, branchLink))
                let branchesDataResponse = await Promise.all(branchDataPromises);
                _.each(branchesDataResponse, (branchData) => branchesData = [...branchesData, ...branchData.data]);
                _.each(commitsLink, (commitLink) => {
                    _.each(branchesData, (branchData) => {
                        if (branchData.commit.url.includes(commitLink))
                            commitsDataPromises.push(get(githubAccessToken, commitLink + "?sha=" + branchData.commit.sha, branchData.name))
                    })
                })
                const commitsDataResponse = await Promise.all(commitsDataPromises);
                _.each(commitsDataResponse, (commitData) => {
                    commitsData = [...commitsData, ...commitData.data]
                    _.each(commitData.data, (singleCommit) => {
                        singleCommit.branchName = commitData.config.headers.branchName
                    })
                })
                const keyedOrgsData = _.keyBy(orgsData, 'html_url')
                _.each(commitsData, commits => {
                    gitHubData.push({
                        repo: {
                            name: keyedOrgsData[_.first(commits.html_url.split('/commit/'))] && keyedOrgsData[_.first(commits.html_url.split('/commit/'))].name,
                            owner: {
                                name: keyedOrgsData[_.first(commits.html_url.split('/commit/'))] && keyedOrgsData[_.first(commits.html_url.split('/commit/'))].owner.login,
                                avatarUrl: keyedOrgsData[_.first(commits.html_url.split('/commit/'))] && keyedOrgsData[_.first(commits.html_url.split('/commit/'))].owner.avatar_url
                            }
                        },
                        branchName: commits.branchName,
                        message: commits.commit.message,
                        committer: {
                            avatarUrl: commits.committer && commits.committer.avatar_url || 'abc',
                            name:
                                (commits.committer && commits.committer.login) ||
                                commits.commit.committer.name,
                            id: commits.committer && commits.committer.id,
                            type: commits.committer && commits.committer.type
                        },
                        date: commits.commit.committer.date
                    });
                });
                gitHubData = _.sortBy(gitHubData, commit => {
                    return commit.date;
                });
                gitHubData = _.reverse(gitHubData);
            }
        }

        projectKeys = projectKeys && projectKeys.length && projectKeys.split(",");
        if (_.isEmpty(allProjectKeys)) {
            const data = await getAllProjects(jiraAccessToken, clientData.data.baseUrl);
            allProjectKeys = _.map(data, k => k.key);
        }

        if (_.isEmpty(projectKeys)) projectKeys = allProjectKeys;
        if (projectKeys && projectKeys.length) {
            const projectPromises = _.map(projectKeys, (projectKey) => getAllProjectIssues(jiraAccessToken, clientData.data.baseUrl, projectKey));
            const projectResponse = await Promise.all(projectPromises);
            _.each(projectResponse, (project) => userIssues = [...userIssues, ...project]);
            _.each(userIssues, (userIssue) => {
                userIssue.issueLink = `${clientData.data.baseUrl}/browse/${userIssue.key}`;
                if (userIssue.histories.length && userIssue.histories[0].from) {
                    // const accountId =
                    //     userIssue.histories.length && userIssue.histories[0].from;
                    // userIssue.histories[0].avatars = await getUserByAccountId(
                    //     jiraAccessToken,
                    //     clientData.data.baseUrl,
                    //     accountId
                    // );
                }
            })
            userIssues = _.sortBy(userIssues, i => {
                return i.fields.updated;
            });
            userIssues = _.reverse(userIssues);
        }
        res.render("headlines", {
            title: "Headlines",
            data: userIssues,
            projects: allProjectKeys,
            gitHubData,
            repoNames: allRepoNames,
            showGithubUrl: _.isEmpty(githubAccessToken),
            jiraAccessToken: jiraAccessToken
        });
    });

    app.get("/github/oauth/redirect", async (req, res, next) => {
        const { installation_id, code: requestToken, setup_action } = req.query;
        const accessToken = await authorizeApp(requestToken);
        const foundSubscription = await Subscriptions.findOne({
            where: { github_installation_id: installation_id }
        });
        if (!foundSubscription) {
            await Subscriptions.create({
                github_access_token: accessToken,
                github_installation_id: installation_id,
                action: setup_action
            });
        } else {
            await Subscriptions.update({
                github_access_token: accessToken,
                action: setup_action      
            }, {where: {github_installation_id: installation_id} })
        }
        const foundClient = await Installations.findOne({
            where: { github_installation_id: installation_id }
        });
        res.redirect(`${foundClient.data.baseUrl}/plugins/servlet/ac/headlines-jira/headlines`);
    });

    app.post("/github/setup", async (req, res, next) => {
        const { orgName } = req.body;
        const requestJwt = req.headers.referer.slice(req.headers.referer.indexOf("jwt") + 4);
        const { iss: clientKey } = jwt.decode(requestJwt, "", true);

        await Installations.update(
            {
                client_key: clientKey,
                organisation: _.trim(orgName)
            },
            { where: { client_key: clientKey } }
        )
            .then(() => {
                res.status(200).json({
                    link: "https://github.com/apps/jira-git-headlines"
                });
            })
            .catch(err => {
                res.sendStatus(500).json({
                    err: err,
                    message: "Subscription save error"
                });
            });
    });

    app.post("/github/events", async (req, res, next) => {
        // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // console.log(req.body, "Webhook url"); // The github throw much data here we will have to process it properly
        // console.log("*********************************************");
        let { repositories, action } = req.body;
        const { id: installationId, account: installedFor, target_type, repository_selection } = req.body.installation;

        const foundSubscriptionWithId = await Subscriptions.findOne({
            where: { github_installation_id: installationId }
        });

        if (action === "created") {
            const jiraHost = await Installations.findOne({
                where: { organisation: installedFor.login }
            });

            if (foundSubscriptionWithId) {
                await Subscriptions.update(
                    {
                        organisation: installedFor.login,
                        jira_client_key: jiraHost.client_key,
                        github_account: installedFor,
                        repositories: repositories,
                        repository_selection,
                        account_type: target_type
                    },
                    { where: { github_installation_id: installationId } }
                );
            } else {
                await Subscriptions.create({
                    organisation: installedFor.login,
                    jira_client_key: jiraHost.client_key,
                    github_installation_id: installationId,
                    github_account: installedFor,
                    repositories: repositories,
                    repository_selection,
                    account_type: target_type
                });
            }
            await Installations.update(
                { github_installation_id: installationId },
                { where: { organisation: installedFor.login } }
            );
        }

        if (action === "removed") {
            const { repositories_removed } = req.body;
            let oldRepos = foundSubscriptionWithId.repositories;
            const oldRepoIds = _.map(oldRepos, "id");

            _.map(repositories_removed, r => {
                const foundIndex = oldRepoIds.indexOf(r.id);
                if (foundIndex > -1) oldRepos.splice(foundIndex, 1);
            });
            await Subscriptions.update(
                {
                    repositories: oldRepos,
                    repository_selection,
                    account_type: target_type
                },
                { where: { github_installation_id: installationId } }
            );
           
        }

        if (action === "added") {
            const { repositories_added } = req.body;
            const oldRepos = foundSubscriptionWithId.repositories;
            const alreadExists = _.find(oldRepos, oldRepo => {
                let found;
                _.map(repositories_added, newRepo => {
                    found = oldRepo.id === newRepo.id;
                    return;
                });
                return found;
            });
            if (!alreadExists) {
                const reposUpdated = [...oldRepos, ...repositories_added];
                await Subscriptions.update({ 
                        repositories: reposUpdated,
                        repository_selection,
                        account_type: target_type
                    },
                    { where: { github_installation_id: installationId } }
                );
            }
        }

        if (action === "deleted") {
            await Subscriptions.destroy({
                where: { github_installation_id: installationId }
            });
            await Installations.update(
                {
                    github_installation_id: null
                },
                { where: { github_installation_id: installationId } }
            );
        }
    });
}
