export const InstallationsModel = (sequelize, type) => {
    return sequelize.define("installations", {
        client_key: {
            type: type.STRING,
            primaryKey: true
        },
        github_access_token: type.STRING,
        data: type.JSONB,
        account_id: type.STRING,
        jira_token: type.JSONB
    });
};

export const findAndUpdateElseInsert = async (Installations, data, token) => {
    const { clientKey } = data;

    await Installations.findByPk(clientKey)
        .then(client => {
            return client.update({
                client_key: clientKey,
                data: data
            });
        })
        .catch(async err => {
            await Installations.create({
                client_key: clientKey,
                data: data
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
