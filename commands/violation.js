module.exports = {
    name: 'مخالف',
    async execute(message, args, db) {
        // نفس منطق -باند تماماً، فقط اسم الأمر مختلف
        return require('./band').execute(message, args, db);
    }
};
