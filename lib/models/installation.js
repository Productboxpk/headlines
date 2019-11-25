export const InstallationsModel = (sequelize, type) => {
    return sequelize.define("installations", {
        client_key: {
            type: type.STRING,
            primaryKey: true
        },
        oauth_client_id: type.STRING,
        public_key: type.STRING,
        shared_secret: type.STRING,
        jira_host: type.STRING,
        jira_event_type: type.STRING,
        github_access_token: type.STRING,
    });
};