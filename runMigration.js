const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('expensesapp', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql'
});

async function runMigration() {
    try {
        console.log('Running migration...');
        
        await sequelize.getQueryInterface().addColumn('Expenses', 'note', {
            type: Sequelize.STRING,
            allowNull: true
        });
        
        console.log('Migration completed successfully! Column "note" added to Expenses table.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
