import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues } from "../lib/api/jira";
import { authorizeApp, getCurrentUser, getCurrentUserOrganizations, get } from "../lib/api/github";
import { Installations } from "../db";
import { findAndUpdateElseInsert, findByUserAccountId } from "../lib/models/installation";
import { token } from "../lib/jira";
import * as jwt from "atlassian-jwt";
let userAccountId=null;
export default function routes(app, addon) {
    app.post("/installed", async (req, res, next) => {
        const authJWT = req.headers.authorization.slice(4);
        const { sub, iss } = jwt.decode(authJWT, "", true);
        if (iss === req.body.clientKey) {
            await findAndUpdateElseInsert(Installations, req.body, sub);
            return res.sendStatus(200);
        }
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", async (req, res, next) => {
        const requestJwt = req.query && req.query.jwt && jwt.decode(req.query.jwt, "", true) || null;
        userAccountId = requestJwt && requestJwt.sub || null;
        const clientKey = requestJwt && requestJwt.iss !== 'micros/oauth-2-authorization-server' && requestJwt.iss || null;
        const { accessToken: jiraAccessToken, updatedClient: clientData } = await token(clientKey, userAccountId);
        let allProjectKeys = [];
        let projectKeys = req.query.projectKey;
        let repoNames = req.query.repoNames;
        let userIssues = [];
        let accessToken;
        let gitHubData = [];
        const allRepoNames = [];

        if (!_.isEmpty(clientData && clientData.github_access_token)) {
            accessToken = clientData.github_access_token;
            const commitsDataPromises = []
            let branchesData = [];
            let commitsData = [];
            const { data: orgs } = await getCurrentUserOrganizations(accessToken);
            if (orgs.length) {
                const orgsReposDataPromises = _.map(orgs, (org) => { return get(accessToken, org.repos_url) });
                let orgsData = await Promise.all(orgsReposDataPromises);
                orgsData = _.first(orgsData).data;
                const branchsLink = [];
                const commitsLink = [];
                _.each(orgsData, (orgData) => {
                    allRepoNames.push(orgData.name);
                    if (_.isEmpty(repoNames)) {
                        branchsLink.push(orgData.branches_url.slice(0, -9));
                        commitsLink.push(orgData.commits_url.slice(0, -6));
                    }
                    if (_.includes(repoNames, orgData.name)) {
                        branchsLink.push(orgData.branches_url.slice(0, -9));
                        commitsLink.push(orgData.commits_url.slice(0, -6));
                    }
                })
                const branchDataPromises = _.map(branchsLink, (branchLink) => get(accessToken, branchLink))
                let branchesDataResponse = await Promise.all(branchDataPromises);
                _.each(branchesDataResponse, (branchData) => branchesData = [...branchesData, ...branchData.data]);
                _.each(commitsLink, (commitLink) => {
                    _.each(branchesData, (branchData) => {
                        if (branchData.commit.url.includes(commitLink))
                            commitsDataPromises.push(get(accessToken, commitLink + "?sha=" + branchData.commit.sha, branchData.name))
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
            showGithubUrl: _.isEmpty(accessToken),
            jiraAccessToken: jiraAccessToken
        });
    });

    app.get("/github/oauth/redirect", async (req, res, next) => {
        const requestToken = req.query.code;
        const accessToken = await authorizeApp(requestToken);
        // testing token
        const { status } = await getCurrentUser(accessToken);
        if (status === 200) {
            await Installations.update({ github_access_token: accessToken }, { where: { account_id: userAccountId } });
            const updatedClient = await findByUserAccountId(Installations, userAccountId);
            if (updatedClient) {
                res.redirect(
                    `${updatedClient.data.baseUrl}/plugins/servlet/ac/headlines-jira/headlines`
                );
            }
        }
    });

    app.post("/github/events", (req, res, next) => {
        console.log(req, "Webhook url");
    });

    app.get("/github-setup", (req, res, next) => {
        res.redirect("https://github.com/settings/apps/jira-git-headlines/installations");
    });
}
