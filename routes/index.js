import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jira";
import { authorizeApp, getCurrentUser, getCurrentUserOrganizations, get } from "../lib/api/github";
import { Installations } from "../db";
import { findAndUpdateElseInsert } from "../lib/models/installation";
import { token } from "../lib/jira";
import * as jwt from "atlassian-jwt";

let CLIENT_KEY = null;

export default function routes(app, addon) {
    app.post("/installed", async (req, res, next) => {
        CLIENT_KEY = req.body.clientKey;
        await findAndUpdateElseInsert(Installations, req.body);
        return res.sendStatus(200);
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", async (req, res, next) => {
        const { sub } = req.query && req.query.jwt && jwt.decode(req.query.jwt, "", true);
        const { accessToken: jiraAccessToken, updatedClient: clientData } = await token(CLIENT_KEY, sub);
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
            const keyedBranches = _.keyBy(branchesData, 'commit.sha')
            console.log(JSON.stringify(keyedBranches));
            _.each(commitsLink, (commitLink) => {
                _.each(branchesData, (branchData) => {
                    if(branchData.commit.url.includes(commitLink))
                    commitsDataPromises.push(get(accessToken, commitLink + "?sha=" + branchData.commit.sha))
                })
            })
            const commitsDataResponse = await Promise.all(commitsDataPromises);
            _.each(commitsDataResponse, (commitData) => commitsData = [...commitsData, ...commitData.data])
            _.each(commitsData, commits => {
                gitHubData.push({
                    // repo: {
                    //     name: orgsReposData[i].name,
                    //     owner: {
                    //         name: orgsReposData[i].owner.login,
                    //         avatarUrl: orgsReposData[i].owner.avatar_url
                    //     }
                    // },
                    branchName: keyedBranches[commits.sha] && keyedBranches[commits.sha].name || keyedBranches[commits.sha].name,
                    message: commits.commit.message,
                    committer: {
                        avatarUrl: commits.committer && commits.committer.avatar_url,
                        name:
                            (commits.committer && commits.committer.login) ||
                            commits.commit.committer.name,
                        id: commits.committer && commits.committer.id,
                        type: commits.committer && commits.committer.type
                    },
                    date: commits.commit.committer.date
                });
            });
                                
                            
            // if (_.isEmpty(repoNames)) {
            //     for (let i = 0; i <= orgsReposData.length - 1; i++) {
            //         const branchLink = orgsReposData[i].branches_url.slice(0, -9);
            //         let commitLink = orgsReposData[i].commits_url.slice(0, -6);
            //         allRepoNames.push(orgsReposData[i].name);

            //         let { data: branchesData } = await get(accessToken, branchLink);

            //         let commitsData = [];

            //         for (let j = 0; j <= branchesData.length - 1; j++) {
            //             let { data: commits } = await get(
            //                 accessToken,
            //                 commitLink + "?sha=" + branchesData[j].commit.sha
            //             );
            //             commits = { [branchesData[j].name]: commits };
            //             commitsData = [...commitsData, commits];
            //         }
            //         _.map(commitsData, commits => {
            //             _.mapValues(commits, (value, key) => {
            //                 commitsData = _.map(value, v => {
            //                     return {
            //                         repo: {
            //                             name: orgsReposData[i].name,
            //                             owner: {
            //                                 name: orgsReposData[i].owner.login,
            //                                 avatarUrl: orgsReposData[i].owner.avatar_url
            //                             }
            //                         },
            //                         branchName: key,
            //                         message: v.commit.message,
            //                         committer: {
            //                             avatarUrl: v.committer && v.committer.avatar_url,
            //                             name:
            //                                 (v.committer && v.committer.login) ||
            //                                 v.commit.committer.name,
            //                             id: v.committer && v.committer.id,
            //                             type: v.committer && v.committer.type
            //                         },
            //                         date: v.commit.committer.date
            //                     };
            //                 });
            //                 gitHubData = [...gitHubData, ...commitsData];
            //             });
            //         });
            //     }
            //     repoNames = allRepoNames;
            // } else {
            //     for (let i = 0; i <= orgsReposData.length - 1; i++) {
            //         allRepoNames.push(orgsReposData[i].name);
            //         if (_.includes(repoNames, orgsReposData[i].name)) {
            //             const branchLink = orgsReposData[i].branches_url.slice(0, -9);
            //             let commitLink = orgsReposData[i].commits_url.slice(0, -6);

                    //     let { data: branchesData } = await get(accessToken, branchLink);

                    //     let commitsData = [];

                    //     for (let j = 0; j <= branchesData.length - 1; j++) {
                    //         let { data: commits } = await get(
                    //             accessToken,
                    //             commitLink + "?sha=" + branchesData[j].commit.sha
                    //         );
                    //         commits = { [branchesData[j].name]: commits };
                    //         commitsData = [...commitsData, commits];
                    //     }
                    //     _.map(commitsData, commits => {
                    //         _.mapValues(commits, (value, key) => {
                    //             commitsData = _.map(value, v => {
                    //                 return {
                    //                     repo: {
                    //                         name: orgsReposData[i].name,
                    //                         owner: {
                    //                             name: orgsReposData[i].owner.login,
                    //                             avatarUrl: orgsReposData[i].owner.avatar_url
                    //                         }
                    //                     },
                    //                     branchName: key,
                    //                     message: v.commit.message,
                    //                     committer: {
                    //                         avatarUrl: v.committer.avatar_url,
                    //                         name: v.committer.login,
                    //                         id: v.committer.id,
                    //                         type: v.committer.type
                    //                     },
                    //                     date: v.commit.committer.date
                    //                 };
                    //             });
                    //             gitHubData = [...gitHubData, ...commitsData];
                    //         });
                        // });
                    }
                // }
            // }
        // }

        projectKeys = projectKeys && projectKeys.length && projectKeys.split(",");
        if (_.isEmpty(allProjectKeys)) {
            try {
                const data = await getAllProjects(
                    jiraAccessToken,
                    clientData.data.baseUrl
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
                    clientData.data.baseUrl,
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
                        clientData.data.baseUrl,
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
                        clientData.data.baseUrl,
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
            const client = await Installations.findByPk(CLIENT_KEY)
            const updatedClient = await client.update({github_access_token: accessToken}, {where: {client_key: CLIENT_KEY}});
            if(updatedClient) {
                res.redirect(
                    `${updatedClient.data.baseUrl}/plugins/servlet/ac/jira-git-headlines/headlines`
                );
            }
        }
    });

    app.post("/github/events", (req, res, next) => {
        // console.log(req, "Webhook url");
    });

    app.get("/github-setup", (req, res, next) => {
        res.redirect("https://github.com/settings/apps/jira-git-headlines/installations");
    });
}
