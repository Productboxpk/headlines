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

export const findAndUpdateElseInsert = async (Installations, data) => {
    const { clientKey } = data;
    try {
        const client = await Installations.findByPk(clientKey);
        if (client) {
            Installations.update(clientKey, { data: data });
            return
        }
        await Installations.create({
            client_key: clientKey,
            data: data
        })
    } catch (error) {
        return error;
    }
};

export const findByClientKey = async (Installations, clientKey) => {
    return Installations.findByPk(clientKey)
};

export const findByUserAccountId = async (Installations, userAccountId) => {
    return Installations.find({where: {account_id: userAccountId}});
};
