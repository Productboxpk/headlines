import moment from "moment";
import * as jwt from "atlassian-jwt";
import {oauthLoginUrl} from '@octokit/oauth-login-url';
import { App } from "@octokit/app";
import { request } from "@octokit/request";

export const createToken = (req, res, next) => {
    const now = moment().utc();

    const tokenData = {
        "iss": req.context.oauthClientId,
        "sub": req.context.userAccountId,
        "tnt": req.context.hostBaseUrl,
        "aud": "https://auth.atlassian.io",
        "iat": now.unix(),
        "exp": now.add(1, "minutes").unix(),
        "qsh": jwt.createQueryStringHash(req)
    }; 
    const token = jwt.encode(tokenData, "131dasd123dade34sda12");
    console.log(token, 'tokenIs')
    next()
    return token
};


export const githubAuth = (req, res, next) => {
    console.log(req.context.hostBaseUrl, 'reqIs')

    const { url, clientId, allowSignup, scopes, state } = oauthLoginUrl({
        clientId: process.env.client_id,
        redirectUri: `${req.context.hostBaseUrl}/plugins/servlet/ac/jira-git-headlines/headlines`,
        scopes: ['repo'],
        allowSignup: true,
        state: Math.random().toString(36).substr(2),
    })

    console.log(url, clientId, allowSignup, scopes, state, 'returned data')
    next();

}

export const asInstallation = async (req, res, next) => {
    const installationId = req.query.installation_id;
    console.log(installationId, 'installationIdIsHere')

    const APP_ID = process.env.client_id;
    // const PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY

    const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0WJwe8wllTGsjZ2wfEwlV7ENyzaABwluTX4sdBoOvtrqt537\nCTrf93mKLDrKcqMWxLdY0vlKc6zd2LMSpES5p0mkNVfW/6NvntkZu9l4PK/jetBr\n3K5hSOlOnGEfLS99jK4jFJL6OYdbG3bc4Ijc7lUnZL4x36Tol1GWiGjC1QzinVfI\nIvqHbEjQH+3URxVanMfT3XQH6kxgVWi4KaotbNS1GM8UatcAdS+AaX28JQ7aF8Rd\nj/V60L9sWHuLzf+1xEF/ciCjTbTzJO6EtkWUPErbP6sW56xHZDyxj9BguF5GmAtt\nblXaHRifaxkNnwTiwtNN3AtxB4KfGQgkvKmyQwIDAQABAoIBACuDvcS8pILhE+9K\nekcavBgBX9B/vxO3Tgkk07A9Shs3+9e1KVq9tZYE2EZg4Xn5kt3HDNqrnGF155UF\ngjZJYhv2Hf5IBxKRsLzeeY6kn2xdUXVQo1n1k5pHgmLVfFkzqW/3MKsx8HbMPo7y\noOy5BNEzOUCillLYPs5T0mj+/J6x8pXFq4LwBOvZ/0b6BCsJr5GIVf6Wez3LoyBa\nmpgkoHxL/0vSWcGk7RPE08/NnHtS80/ITxjbjOIy70Xj1KfcWYPT9pnSD5TwAT6i\nE52XQtMcTGL3vkhSLjx/t6TBk5kDs8d3WzjGgBzRJCLUnUSCYAUJzyrtk5NCvwqC\nblonoqECgYEA7HcXvKgQ5mn63LRLDISdo1KO+16ZwU6BT1Wq+adkIFdaX/f7X2AT\nBfXbya1vvThLqCfnjEsWgz2Yh86P/eQiD3thFR9zk8EOibRwUpkov6VF05p6eGI/\nh3kw+aOQFgbgzn/wcjx+//iHb2EItvyvSeeR0bUyZ5zEUZO6f4Wj918CgYEA4q6g\n220psB+SO+EMWqYDbuchxfIGX8oz2t3zhSrZjKcsrPIupk5hXJlOAftB3foUpP3a\nlUAo6jwEgZTp7XpGR3mRWgy+LR2JWZnujYsNVbXvwyq2peNSAu53reofgU2Vlo8j\nIC65cEwXElejnwPHakDx3JkwIKII6rS3aZVXI50CgYEAnhm6Sy7rrcLqMapyCzqX\n010dsD+9+ZstpgeXOziKH32INWYuMcSgs3mArEVD0nXTT+juTcTeln0WgKbBa3We\nuE87x82xjvaja7qy5ub0cb5lA2fjvp2h8Eg9UIvliHSs1iSAdUCxgR+AHh34n7Au\n2vDzdAz8WH5eXFSzexO1X20CgYBfErz2qxdD/knYAXCsCFsCRcCdg//2ZxlOn66G\nWM17t5X+R2kXaWJecxILtLUQg9XqyWnHFWzTqS5+ptViO9mEGtHCwft1cqDryqsK\nBJsoKrGP2rdWZjw8bIYXlE14bvDhf9FMqywtlExM7iL7C5u0zd5jFoDf/vXccsVG\nbFNq5QKBgQCE7h3guykcjBAiXnM3fwUzB7rzQ6bx0A5B1eOx+22kHPfoj3G/0qq2\npYsviqwbmzwxjc/lhhDbp7qGQrbMUWEaYD549UXubWGBFmw8koHT/3CcUXp0QhJw\nMmEF4PeZfoRt5gM4HnmObpigDtF36dWzfL+FpZeM0Ki3+aOo1CLzuw==\n-----END RSA PRIVATE KEY-----\n";

    const app = new App({ id: APP_ID, privateKey: PRIVATE_KEY });

    const installationAccessToken = await app.getInstallationAccessToken({ installationId }).catch(err => console.log(err, "Access Token Err"));

    console.log(installationAccessToken, "installationAccessToken");

    // const { data } = await request("GET /repos", {
    //     headers: {
    //         authorization: `token ${installationAccessToken}`,
    //         accept: "application/vnd.github.machine-man-preview+json"
    //     }
    // }).catch(err => console.log(err, "Request err"));

    // contains the installation id necessary to authenticate as an installation
    //   const installationId = data.id;

    // console.log(data, "dataIsHere");
    

    next();
    // const installationAccessToken = await app.getInstallationAccessToken({
    // installationId
    // });

    // // https://developer.github.com/v3/issues/#create-an-issue
    // await request("POST /repos/:owner/:repo/issues", {
    // owner: "hiimbex",
    // repo: "testing-things",
    // headers: {
    //     authorization: `token ${installationAccessToken}`,
    //     accept: "application/vnd.github.machine-man-preview+json"
    // },
    // title: "My installation’s first issue"
    // });
};