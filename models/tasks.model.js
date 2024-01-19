
module.exports = (sequelize, Sequelize) => {
    const Task   = sequelize.define("tasks", {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
            defaultValues:0
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        deadline: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        completed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
    });

    Task.associate = (models) => {
        Task.hasOne(models.Reminder, {
            foreignKey: 'taskId',
            onDelete: 'CASCADE',
        });
    };

    return Task;
};