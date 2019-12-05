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
        jira_access_token: type.STRING
    });
};

export const findAndUpdateElseInsert = async (Installations, data, token) => {
    const { clientKey, oauthClientId, publicKey, sharedSecret, baseUrl, eventType } = data;

    await Installations.findByPk(clientKey)
        .then(client => {
            return client.update({
                oauth_client_id: oauthClientId,
                public_key: publicKey,
                shared_secret: sharedSecret,
                jira_host: baseUrl,
                event_type: eventType,
                jira_access_token: token
            });
        })
        .catch(async err => {
            await Installations.create({
                client_key: clientKey,
                oauth_client_id: oauthClientId,
                public_key: publicKey,
                shared_secret: sharedSecret,
                jira_host: baseUrl,
                event_type: eventType,
                jira_access_token: token
            }).catch(err => {
                console.log(err, "save err");
            });
        });
};

export const findByClientKey = async (Installations, clientKey) => {
    let client;
    await Installations.findByPk(clientKey)
        .then(data => {
            client = data;
        })
        .catch(err => {
            console.log(err, "find err");
        });
    return client;
};
