AJS.$(window).load(function () {
    // let jwt_token = AJS.$('meta[name="token"]').attr("content");
    let jiraAccessToken = AJS.$('meta[name="jiraAccessToken"]').attr("content");
    setInterval(function() {
        const getSelectedProjectLinkUrl = `headlines?projectKey=${clickedProject === null ? '' : clickedProject}&repoNames=${clickedRepo === null ? '' : clickedRepo}&jwt=${jiraAccessToken}`;
        $.ajax({
            type: 'GET',
            url: getSelectedProjectLinkUrl,
            success: function (data) {
                $('.issues-container').replaceWith(`<div class="issues-container">${$(".issues-container", data).html()}</div>`);
                $('.issues-container .jira-loader').addClass('hide-loader')
                $('.branches-container').replaceWith(`<div class="branches-container">${$(".branches-container", data).html()}</div>`);
                $('.branches-container .jira-loader').addClass('hide-loader')
            }
        });
    },10000)
    
    let clickedProject = null;
    let clickedRepo = null;
    $('.project-link').on('click', function (e) {
        $('.issues-container .jira-loader').removeClass('hide-loader')
        clickedProject = $(this).attr('name');
        let getSelectedProjectLinkUrl = null;
        if (clickedProject === 'All') {
            getSelectedProjectLinkUrl = `headlines?jwt=${jiraAccessToken}`
        } else {
            getSelectedProjectLinkUrl = `headlines?projectKey=${clickedProject}&repoNames=${clickedRepo}&jwt=${jiraAccessToken}`;
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
        let getSelectedProjectLinkUrl = null;
        if (clickedRepo === 'All') {
            getSelectedProjectLinkUrl = `headlines?jwt=${jiraAccessToken}`
        } else {
            getSelectedProjectLinkUrl = `headlines?projectKey=${clickedProject}&repoNames=${clickedRepo}&jwt=${jiraAccessToken}`;
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
