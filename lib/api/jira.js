import * as _ from "lodash";
import axios from "axios";

export async function getAllProjects(accessToken, jiraBsaeURL) {
    const { data } = await axios({
        method: "GET",
        url: `${jiraBsaeURL}/rest/api/3/project?`,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }).catch(err => console.log(err, "Orgs error"));
    return data;
}

export async function getAllProjectIssues(accessToken, jiraBsaeURL, projectKey) {
    let userIssues = [];
    const { data } = await axios({
        method: "GET",
        url: `${jiraBsaeURL}/rest/api/3/search?expand=changelog&fields=all,summary,description,assignee,updated,status,updatedHistroy=true&jql=project=${projectKey}`,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }).catch(err => console.log(err, "Orgs error"));

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

    return  [...userIssues];
}

export async function getUserByAccountId(accessToken, jiraBsaeURL, accountId) {
    const { data } = await axios({
        method: "GET",
        url: `${jiraBsaeURL}/rest/api/3/user?accountId=${accountId}`,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }).catch(err => console.log(err, "Orgs error"));

    return data.avatarUrls;
}
