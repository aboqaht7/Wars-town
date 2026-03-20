const muteCmd = require('./اسكت');

module.exports = {
    name: 'اص',
    async execute(message, args, db) {
        return muteCmd.execute(message, args, db);
    }
};
