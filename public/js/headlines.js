AJS.$(window).load(function() {
    // let jwt_token = AJS.$('meta[name="token"]').attr("content");
    let jiraAccessToken = AJS.$('meta[name="jiraAccessToken"]').attr("content");
    
    console.log(jiraAccessToken, 'jiraAccessToken')
    let projectKeys = [];
    let repoNames = [];

    function addEventListeners() {
        let jiraProjects = document.getElementsByClassName("project-link");
        let githubRepos = document.getElementsByClassName("repositories-link");
        let jiraLoader = document.getElementsByClassName("jira-loader")[0];
        let gitHubLoader = document.getElementsByClassName("github-loader")[0];

        for (let i = 0; i <= jiraProjects.length - 1; i++) {
            const current = jiraProjects[i];
            current.addEventListener("change", function(e) {
                jiraLoader.classList.remove("hide-loader");
                if (e.target.checked && projectKeys.findIndex(key => key == e.target.name) === -1) {
                    projectKeys.push(e.target.name);
                    sendSelectedProjects(projectKeys.toString());
                } else {
                    const index = projectKeys.findIndex(key => key == e.target.name);
                    projectKeys.splice(index, 1);
                    sendSelectedProjects(projectKeys.toString());
                }
            });
        }

        for (let i = 0; i <= githubRepos.length - 1; i++) {
            const current = githubRepos[i];
            current.addEventListener("change", function(e) {
                gitHubLoader.classList.remove("hide-loader");
                if (e.target.checked && repoNames.findIndex(key => key == e.target.name) === -1) {
                    repoNames.push(e.target.name);
                    sendSelectedRepositories(repoNames.toString());
                } else {
                    const index = repoNames.findIndex(key => key == e.target.name);
                    repoNames.splice(index, 1);
                    sendSelectedRepositories(repoNames.toString());
                }
            });
        }
    }

    function sendSelectedProjects(projectkey) {
        const repoName = repoNames.toString();
        if (projectKeys.length > 0) {
            let jiraLoader = document.getElementsByClassName("loader")[0];
            var XHR = new XMLHttpRequest();

            XHR.onreadystatechange = function() {
                if (XHR.readyState == 4) {
                    if (XHR.status == 200) {
                        AJS.$("body").html(XHR.responseText);
                        jiraLoader.classList.add("hide-loader");
                        addEventListeners();
                        projectKeys = [];
                    } else {
                        console.log("There was a problem!!!");
                    }
                }
            };

            XHR.open("GET", `headlines?projectKey=${projectkey}&repoNames=${repoName}`);
            XHR.setRequestHeader("Authorization", `Bearer ${jiraAccessToken}`);
            XHR.send();
        }
    }

    function sendSelectedRepositories(repoName) {
        const projectkey = projectKeys.toString();
        if (repoNames.length > 0) {
            let gitHubLoader = document.getElementsByClassName("loader")[0];
            var XHR = new XMLHttpRequest();

            XHR.onreadystatechange = function() {
                if (XHR.readyState == 4) {
                    if (XHR.status == 200) {
                        AJS.$("body").html(XHR.responseText);
                        gitHubLoader.classList.add("hide-loader");
                        addEventListeners();
                        repoNames = [];
                    } else {
                        console.log("There was a problem!!!");
                    }
                }
            };

            XHR.open("GET", `headlines?repoNames=${repoName}&projectKey=${projectkey}`);
            XHR.setRequestHeader("Authorization", `Bearer ${jiraAccessToken}`);
            XHR.send();
        }
    }
    addEventListeners();
});
