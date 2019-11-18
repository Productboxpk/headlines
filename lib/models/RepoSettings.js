import { Sequelize, Model } from "sequelize";

class RepoSettings extends Model {}

const sequelize = new Sequelize();

RepoSettings.init(
  {
    id: Sequelize.UUID,

    username: Sequelize.STRING,
    accessToken: Sequelize.STRING,
    ownerName: Sequelize.STRING,
    repoName: Sequelize.STRING
  },
  {
    sequelize,
    modelName: "repo-settings"
  }
);
