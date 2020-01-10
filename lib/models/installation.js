export const InstallationsModel = (sequelize, type) => {
    return sequelize.define("installations", {
        client_key: {
            type: type.STRING,
        },
        data: type.JSONB,
        account_id: { type: type.STRING, primaryKey: true },
        jira_token: type.JSONB,
        enabled: type.BOOLEAN
    });
};

export const findAndUpdateElseInsert = async (Installations, data, userAccountId) => {
    const { clientKey } = data;
    try {
        const client = await Installations.findByPk(clientKey);
        if (client) {
            Installations.update(clientKey, { data: data, account_id: userAccountId });
            return;
        }
        await Installations.create({
            client_key: clientKey,
            data: data,
            account_id: userAccountId
        })
    } catch (error) {
        return error;
    }
};

export const findElseInsert = async (Installations, clientData, userAccountId) => {
    let dataPromise = Installations.findOne({ where: { account_id: userAccountId } })
    let clientPromise = Installations.findOne({ where: { client_key: clientData.clientKey } });
    const [data, client] = await Promise.all([dataPromise, clientPromise]);
    if (!data) {
        const newAccount = await Installations.create({
            client_key: client.client_key,
            data: client.data,
            account_id: userAccountId
        })
        return newAccount;
    } else {
        return data;
    }
}

export const findByClientKey = async (Installations, clientKey) => {
    return Installations.find({ where: { client_key: clientKey } });
};

export const findByUserAccountId = async (Installations, userAccountId) => {
    return Installations.findOne({ where: { account_id: userAccountId } });
};
