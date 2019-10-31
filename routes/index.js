import * as _ from "lodash";

export default function routes(app, addon, jira) {
  app.get("/", (req, res) => {
    res.redirect("/atlassian-connect.json");
  });

  app.get("/headlines", addon.authenticate(), async (req, res) => {
    const projectKeys = [];
    let issues = [];

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
            "updated",
            "updatedHistroy=true"
          ],
          expand: "changelog"
        })
        .then(data => {
          data.issues.forEach(issue => {
            issues.push({
              key: issue.key,
              fields: issue.fields,
              histories: issue.changelog.histories[0]
            });
          });
        })
        .catch(err => {
          console.log(err, "issues err is here");
        });
    }

    for (let i = 0; i <= issues.length - 1; i++) {
      issues[i].histories.items.avatarUrls;
      const items = _.filter(
        issues[i].histories.items,
        item => item.field === "assignee"
      );
      issues[i].histories = items;
      if (items.length && items[0].from) {
        const from = items.length && items[0].from;

        await jira.user
          .getUser({ userKey: from })
          .then(data => {
            const avatars = data.avatarUrls;
            issues[i].histories[0].avatars = avatars;
          })
          .catch(err => {
            console.log(err, "issues err is here");
          });
      }
    }

    issues = _.sortBy(issues, i => {
      return i.fields.updated;
    });
    issues = _.reverse(issues);

    res.render("headlines", {
      title: "Issues",
      data: issues
    });
  });
}
