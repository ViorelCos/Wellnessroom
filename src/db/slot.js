const mongoose = require('mongoose');
const patcher = require('mongoose-json-patch');

const slotSchema = new mongoose.Schema({
    serviceProvider: mongoose.Schema.ObjectId,
    time: Number,
    creationDate: Number,
    durations: [Number]
});

slotSchema.plugin(patcher);

module.exports = mongoose.model('Slot', slotSchema);
