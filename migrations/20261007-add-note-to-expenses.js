module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Expenses', 'note', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Expenses', 'note');
    }
};
