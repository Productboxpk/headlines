import * as _ from "lodash";
import * as jwt from "atlassian-jwt";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jiraApi";
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
        })
            .then(data => {
                return res.sendStatus(204);
            })
            .catch(err => {
                console.log(err, "save err");
                return res.sendStatus(500);
            });
    });

    app.get("/", (req, res) => {
        res.redirect("/atlassian-connect.json");
    });

    app.get("/headlines", async (req, res) => {
		const token = req.query.jwt;
        console.log(req, "it is req");
        
        

        res.render("headlines", {
            title: "Issues"
        });
    });
}
