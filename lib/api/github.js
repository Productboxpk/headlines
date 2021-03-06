import * as _ from "lodash";
import axios from "axios";

export async function authorizeApp(requestToken) {
    let accessToken;
    await axios({
        method: "post",
        url: `https://github.com/login/oauth/access_token?client_id=${process.env.client_id}&client_secret=${process.env.client_secret}&code=${requestToken}`,
        headers: {
            accept: "application/json"
        }
    })
        .then(response => {
            accessToken = response.data.access_token;
        })
        .catch(err => console.log("Access Token error is here", err));
    return accessToken;
}


export function getCurrentUser(accessToken, githubBaseURL="https://api.github.com/") {
    const data = axios({
        method: "GET",
        url: `${githubBaseURL}user`,
        headers: {
            Authorization: `token ${accessToken}`
        }
    }).catch(err => console.log(err, 'Current User error'))
    return data;
}

export function getCurrentUserOrganizations(accessToken, githubBaseURL="https://api.github.com/") {
    const data = axios({
        method: "GET",
        url: `${githubBaseURL}user/orgs`,
        headers: {
            Authorization: `token ${accessToken}`
        }
    }).catch(err => console.log(err, 'Orgs error'))
    return data;
}

export function get(accessToken, url, branchName=null) {
    const data = axios({
        method: "GET",
        url: `${url}`,
        headers: {
            Authorization: `token ${accessToken}`,
            branchName
        }
    }).catch(err => console.log(err, 'Get error'))
    return data;
}



