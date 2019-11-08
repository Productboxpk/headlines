import * as _ from "lodash";
import { getAllProjects, getAllProjectIssues } from "../api";

export default function routes(app, addon, jar) {
	app.get("/", (req, res) => {
		res.redirect("/atlassian-connect.json");
	});

	app.get("/headlines", addon.checkValidToken(), async (req, res) => {
		let allProjectKeys = ["PL", "PLUG"];
		var httpClient = addon.httpClient(req);
		let projectKeys = req.query.projectKey;
		let userIssues = [];
		const { addonKey, clientKey, token, hostBaseUrl, userAccountId } = req.context;

		if (_.isEmpty(allProjectKeys)) {
			const data = await getAllProjects(userAccountId, httpClient);
			allProjectKeys = _.map(data, k => k.key);
		}

		if (_.isEmpty(projectKeys)) projectKeys = allProjectKeys;

		console.log(allProjectKeys, "Here I am");

		for (let i = 0; i <= projectKeys.length - 1; i++) {
			let data = await getAllProjectIssues(userAccountId, projectKeys[i], httpClient);

			userIssues = [...userIssues, ...data];
			console.log(userIssues, "This is issue");
		}

		res.render("headlines", {
			title: "Issues",
			data: userIssues,
			projects: allProjectKeys
		});
	});
}
