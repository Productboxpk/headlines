import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues, getUserByAccountId } from "../lib/api/jiraApi";
import {Installations} from '../db';

export default function routes(app, addon) {

	app.post("/installed", async (req, res, next) => {
	console.log("Received installation payload");
    const {clientKey, oauthClientId, publicKey, sharedSecret, baseUrl, eventType } = req.body;
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

	app.get("/",(req, res) => {
		res.redirect("/atlassian-connect.json");
	});

	app.get("/headlines", async (req, res) => {
		console.log('addonIs', addon, 'addonIs')
		// Installations.findAll({
		// 	where: {
		// 		client_key: 
		// 	}
		// })
		let allProjectKeys = [];
		var httpClient = addon.httpClient(req);
		let projectKeys = req.query.projectKey;
		projectKeys = projectKeys && projectKeys.length && projectKeys.split(",");
		let userIssues = [];
		const { userAccountId } = req.context;

		if (_.isEmpty(allProjectKeys)) {
			const data = await getAllProjects(userAccountId, httpClient);
			allProjectKeys = _.map(data, k => k.key);
		}

		if (_.isEmpty(projectKeys)) projectKeys = allProjectKeys;
		if (projectKeys.length === 1) {
			let data = await getAllProjectIssues(userAccountId, projectKeys, httpClient);
			userIssues = [...userIssues, ...data];
		} else {
			for (let i = 0; i <= projectKeys.length - 1; i++) {
				let data = await getAllProjectIssues(userAccountId, projectKeys[i], httpClient);
				userIssues = [...userIssues, ...data];
			}
		}
		for (let i = 0; i <= userIssues.length - 1; i++) {
			if (userIssues[i].histories.length && userIssues[i].histories[0].from) {
				const accountId = userIssues[i].histories.length && userIssues[i].histories[0].from;
				userIssues[i].histories[0].avatars = await getUserByAccountId(
					userAccountId,
					accountId,
					httpClient
				);
			}
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
}
