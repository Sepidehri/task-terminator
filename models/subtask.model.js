

module.exports = (sequelize, Sequelize) => {
    const Subtask = sequelize.define('subtasks', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
            defaultValues: 0
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description:{
            type: Sequelize.STRING,
            allowNull: false,
        },
        taskId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    });


    return Subtask;
};