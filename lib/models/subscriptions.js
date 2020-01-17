export const SubscriptionsModel = (sequelize, type) => {
    return sequelize.define("subscriptions", {
        jira_client_key: {
            type: type.STRING
        },
        organisation: type.STRING,
        enterprise: type.STRING,
        github_installation_id: {
            type: type.INTEGER,
            primaryKey: true
        },
        github_access_token: type.STRING,
        github_account: type.JSONB,
        repositories: type.JSONB,
        action: type.STRING
    });
};
