import moment from "moment";
import * as jwt from "atlassian-jwt";

export const createToken = (req, res, next) => {
    console.log('here')

    const now = moment().utc();

    const tokenData = {
        "iss": req.context.oauthClientId,
        "sub": req.context.userAccountId,
        "tnt": req.context.hostBaseUrl,
        "aud": "https://auth.atlassian.io",
        "iat": now.unix(),
        "exp": now.add(1, "minutes").unix(),
        "qsh": jwt.createQueryStringHash(req)
    }; 
    const token = jwt.encode(tokenData, "131dasd123dade34sda12");
    console.log(token, 'tokenIs')
    next()
    return token
};
