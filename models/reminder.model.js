

module.exports = (sequelize, Sequelize) => {
    const Reminder = sequelize.define('reminders', {
        reminderDateTime: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        taskId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    });


    return Reminder;
};