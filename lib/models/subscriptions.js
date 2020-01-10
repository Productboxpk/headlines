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
        repositories: type.ARRAY(type.STRING),
        github_installation_id: type.STRING,
        github_access_token: type.STRING,
        action: type.STRING
    });
};
