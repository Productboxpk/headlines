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
    event_type: type.STRING
  });
};
