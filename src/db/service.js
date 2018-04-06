const mongoose = require('mongoose');

const Service = mongoose.model('Service', {
    name: String
});

module.exports = Service;
