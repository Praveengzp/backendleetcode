const mongoose = require('mongoose');
const User = require('../models/user');

async function dropLegacyUserIndexes() {
    const indexes = await User.collection.indexes().catch((err) => {
        if (err.codeName === 'NamespaceNotFound') {
            return [];
        }

        throw err;
    });
    const problemSolvedIndex = indexes.find((index) => index.name === 'problemSolved_1');

    if (problemSolvedIndex) {
        await User.collection.dropIndex(problemSolvedIndex.name);
        console.log(`Dropped legacy MongoDB index: ${problemSolvedIndex.name}`);
    }

    await User.init();
}

async function main() {
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    await dropLegacyUserIndexes();
}

module.exports = main;
