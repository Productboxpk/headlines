export default function routes(app, addon, jira) {
    
   app.get('/', (req, res) => {
        res.redirect('/atlassian-connect.json');
    });

    app.get('/dashboard', addon.authenticate(), async (req, res) => {
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
        var members = []
        jira.user.all({maxResults: 50})
        .then(data => {
            data.forEach(member => {
                if(member.accountType === 'atlassian'){
                    members.push(member)
                }
            })
            res.render('dashboard', {
                title: 'Members',     
                data: members
            });
        })
        .catch(err => {
            console.log(err, 'err is here')
        })
       
    });
}
