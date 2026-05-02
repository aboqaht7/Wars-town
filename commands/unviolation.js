module.exports = {
    name: 'فك-مخالف',
    async execute(message, args, db) {
        // نفس منطق فك-باند تماماً
        return require('./unband').execute(message, args, db);
    }
};
