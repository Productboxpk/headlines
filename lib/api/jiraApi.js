import * as _ from "lodash";

export async function getAllProjects(userAccountId, httpClient) {
    let data;
    return new Promise((resolve, reject) => {
        httpClient
            .asUserByAccountId(userAccountId)
            .get("rest/api/3/project?", function(err, response, body) {
                data = JSON.parse(body);
                if (err) reject(err);
                resolve(data);
            });
        return data;
    });
}

export async function getAllProjectIssues(userAccountId, projectKey, httpClient) {
    let data;
    let userIssues = [];
    return new Promise((resolve, reject) => {
        httpClient
            .asUserByAccountId(userAccountId)
            .get(
                `/rest/api/3/search?expand=changelog&fields=all,summary,description,assignee,updated,status,updatedHistroy=true&jql=project=${projectKey}`,
                function(err, response, body) {
                    if (err) reject(err);
                    data = JSON.parse(body);
                    const { issues } = data;
                    for (let j = 0; j <= issues.length - 1; j++) {
                        let items = [];
                        if (issues[j].changelog.histories.length) {
                            items = _.filter(
                                issues[j].changelog.histories[0].items,
                                item => item.field === "assignee"
                            );
                        }
                        userIssues.push({
                            key: issues[j].key,
                            fields: issues[j].fields,
                            histories: items
                        });
                    }
                    resolve(userIssues);
                }
            );
        return { ...userIssues };
    });
}

export async function getUserByAccountId(userAccountId, accountId, httpClient) {
    let avatars;
    return new Promise((resolve, reject) => {
        httpClient
            .asUserByAccountId(userAccountId)
            .get(`rest/api/3/user?accountId=${accountId}`, function(err, response, body) {
                if (err) reject(err);
                const data = JSON.parse(body);
                avatars = data.avatarUrls;
                resolve(avatars);
            });
        return avatars;
    });
}
