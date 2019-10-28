import * as _ from "lodash";

export default function routes(app, addon, jira) {
  app.get("/", (req, res) => {
    res.redirect("/atlassian-connect.json");
  });

  app.get("/dashboard", addon.authenticate(), async (req, res) => {
    // jira.project
    //   .getAllProjects({
    //     expand: "description,lead,issueTypes,url,projectKeys,permissions"
    //   })
    //   .then(data => {
    //     console.log(data, "project data");
    //   })
    //   .catch(err => console.log(err, "that is an err"));

    // jira.user.getUser({username: "syed.farhan"})
    //     .then((data) => {
    //         res.render('dashboard', {
    //             title: 'Dashboard',
    //             data: data
    //         });
    //     })
    //     .catch(err => console.log(err, 'err msg'))

    // var members = []
    // jira.user.all({maxResults: 50})
    // .then(data => {
    //     data.forEach(member => {
    //         if(member.accountType === 'atlassian'){
    //             members.push(member)
    //         }
    //     })
    //     res.render('dashboard', {
    //         title: 'Members',
    //         data: members
    //     });
    // })
    // .catch(err => {
    //     console.log(err, 'err is here')
    // })

    let issues = [];

    const projectKeys = [];

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
          ]
        })
        .then(data => {
          data.issues.forEach(issue => {
            issues.push({
              key: issue.key,
              fields: issue.fields
            });
          });
        })
        .catch(err => {
          console.log(err, "issues err is here");
        });
    }

    issues = _.sortBy(issues, i => {
      return i.fields.updated;
    });
    issues = _.reverse(issues);

    res.render("dashboard", {
      title: "Issues",
      data: issues
    });
  });
}
