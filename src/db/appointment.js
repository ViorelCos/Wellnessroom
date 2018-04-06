const mongoose = require('mongoose');
const patcher = require('mongoose-json-patch');

const appointmentSchema = new mongoose.Schema( {
    serviceProvider: mongoose.Schema.ObjectId,
    slot: Number,
    creationDate: Number,
    duration: Number,
    user: String,
    phone: String,
    address: String,
    notes: String,
    offset: Number,
    isHomeMassage: Boolean,
    confirmed: Boolean,
    rejected: Boolean,
    acknowledged: Boolean,
    canceled: Boolean,
    ratingEmailSent: Boolean,
    rateLink: String,
    rating: Number,
    review: String
});

appointmentSchema.plugin(patcher);
module.exports = mongoose.model('Appointment', appointmentSchema);
