AJS.$(window).load(function () {
    let jiraAccessToken = AJS.$('meta[name="jiraAccessToken"]').attr("content");
    let clickedProject = '';
    let projectKeys = [];
    let clickedRepo = '';
    let projectRepos = [];

    AJS.$("#github-data").on('submit', function(e){
        const orgName = AJS.$("#github-org-name").val();
        AJS.$.ajax({
            type: 'POST',
            url: 'github/setup',
            data: {orgName},
            dataType: "json",
            success: function (data) {
                AJS.$("a[rel='modal:close']").trigger("click");
                const { link } = data;
                window.open('https://github.com/organizations/Productboxpk/settings/apps/jira-git-headlines/installations', '_blank');
            }
        });
    })

    // setInterval(function () {
    //     let getSelectedProjectLinkUrl = ''
    //     if (clickedProject === 'All' || projectRepos === 'All') {
    //         getSelectedProjectLinkUrl = `headlines?jwt=${jiraAccessToken}`
    //     } else {
    //         getSelectedProjectLinkUrl = `headlines?projectKey=${projectKeys}&repoNames=${projectRepos}&jwt=${jiraAccessToken}`;
    //     }
    //     $.ajax({
    //         type: 'GET',
    //         url: getSelectedProjectLinkUrl,
    //         success: function (data) {
    //             $('.issues-container').replaceWith(`<div class="issues-container">${$(".issues-container", data).html()}</div>`);
    //             $('.issues-container .jira-loader').addClass('hide-loader')
    //             $('.branches-container').replaceWith(`<div class="branches-container">${$(".branches-container", data).html()}</div>`);
    //             $('.branches-container .jira-loader').addClass('hide-loader')
    //         }
    //     });
    // }, 20000)
    $('.project-link').on('click', function (e) {
        $('.issues-container .jira-loader').removeClass('hide-loader')
        clickedProject = $(this).attr('name');
        let getSelectedProjectLinkUrl = null;
        const allCheckedProjects = $('#jira-projects .project-link');
        if (clickedProject === 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') !== 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            getSelectedProjectLinkUrl = `headlines?jwt=${jiraAccessToken}`
        }
        if (e.target.checked && clickedProject !== 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') === 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            projectKeys.push(clickedProject);
            getSelectedProjectLinkUrl = `headlines?projectKey=${projectKeys}&repoNames=${projectRepos}&jwt=${jiraAccessToken}`;
        }
        if (!e.target.checked && clickedProject !== 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') === 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            const removeIndex = projectKeys.indexOf(clickedProject);
            projectKeys.splice(removeIndex, 1);
        }
        $.ajax({
            type: 'GET',
            url: getSelectedProjectLinkUrl,
            success: function (data) {
                $('.issues-container').replaceWith(`<div class="issues-container">${$(".issues-container", data).html()}</div>`);
                $('.issues-container .jira-loader').addClass('hide-loader')
                $('.jira-dropdown').click();
            }
        });
    })
    $('.repositories-link').on('click', function (e) {
        $('.branches-container .github-loader').removeClass('hide-loader')
        clickedRepo = $(this).attr('name');
        const allCheckedProjects = $('#github-repos .repositories-link');
        let getSelectedProjectLinkUrl = null;
        if (clickedRepo === 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') !== 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            getSelectedProjectLinkUrl = `headlines?jwt=${jiraAccessToken}`
        }
        if (e.target.checked && clickedRepo !== 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') === 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            projectRepos.push(clickedRepo);
            getSelectedProjectLinkUrl = `headlines?projectKey=${projectKeys}&repoNames=${projectRepos}&jwt=${jiraAccessToken}`;
        }
        if (!e.target.checked && clickedRepo !== 'All') {
            for (let index = 0; index < allCheckedProjects.length; index++) {
                if ($(allCheckedProjects[index]).attr('name') === 'All') {
                    $(allCheckedProjects[index]).prop('checked', false)
                }
            }
            const removeIndex = projectRepos.indexOf(clickedRepo);
            projectRepos.splice(removeIndex, 1);
        }

        $.ajax({
            type: 'GET',
            url: getSelectedProjectLinkUrl,
            success: function (data) {
                $('.branches-container').replaceWith(`<div class="branches-container">${$(".branches-container", data).html()}</div>`);
                $('.branches-container .jira-loader').addClass('hide-loader')
                $('.git-dropdown').click();
            }
        });
    })
});
