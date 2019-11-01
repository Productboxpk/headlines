import * as _ from "lodash";

export default function routes(app, addon, jira) {
  app.get("/", (req, res) => {
    res.redirect("/atlassian-connect.json");
  });

  app.get("/headlines", addon.authenticate(), async (req, res) => {
    console.log(req, 'req,req')
    const projectKeys = [];
    let userIssues = [];

    await jira.project
      .getProject()
      .then(data => {
        data.forEach(project => {
          projectKeys.push(project.key);
        });
      })
      .catch(err => {
        console.log(err, "project err is here");
      });

    for (let i = 0; i <= projectKeys.length - 1; i++) {
      await jira.search
        .search({
          method: "GET",
          jql: `project=${projectKeys[i]}`,
          fields: [
            "all",
            "summary",
            "description",
            "assignee",
            "issuetype",
            "updated",
            "updatedHistroy=true"
          ],
          expand: "changelog"
        })
        .then(data => {
          const { issues } = data;
          for (let i = 0; i <= issues.length - 1; i++) {
            let items = _.filter(
              issues[i].changelog.histories[0].items,
              item => item.field === "assignee"
            );

            userIssues.push({
              key: issues[i].key,
              fields: issues[i].fields,
              histories: items
            });
          }
        })
        .catch(err => {
          console.log(err, "issues err is here");
        });
    }

    for (let i = 0; i <= userIssues.length - 1; i++) {
      if (userIssues[i].histories.length && userIssues[i].histories[0].from) {
        const from =
          userIssues[i].histories.length && userIssues[i].histories[0].from;
        await jira.user
          .getUser({ userKey: from })
          .then(data => {
            userIssues[i].histories[0].avatars = data.avatarUrls;
          })
          .catch(err => {
            console.log(err, "get user err is here");
          });
      }
    }

    userIssues = _.sortBy(userIssues, i => {
      return i.fields.updated;
    });
    userIssues = _.reverse(userIssues);

    res.render("headlines", {
      title: "Issues",
      data: userIssues,
      projects: projectKeys
    });
  });
}
