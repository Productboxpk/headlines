export const SubscriptionsModel = (sequelize, type) => {
    return sequelize.define("subscriptions", {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        jira_client_key: {
            type: type.STRING
        },
        organisation: type.STRING,
        enterprise: type.STRING,
        github_installation_id: type.STRING,
        github_access_token: type.STRING,
        github_account: type.STRING,
        repositories: type.JSONB,
        action: type.STRING,
    });
};
