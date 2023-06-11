const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createTime: {
        type: String,
        default: Date.now
    },
    endTime: {
        type: String,
        required: true
    },
    startPrice: {
        type: Number,
        required: true
    },
    image: {
        type: String,  // Assuming you store the image URL as a string
        required: true
    },
    comments: [{ type: mongoose.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Product', ProductSchema);
