"use strict";
export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("RepoSettings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fkClientKey: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING
      },
      accessToken: {
        type: Sequelize.STRING
      },
      ownerName: {
        type: Sequelize.STRING
      },
      repoName: {
        type: Sequelize.STRING
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("RepoSettings");
  }
};
