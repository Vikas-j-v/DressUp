const mongoose = require('mongoose');

// Create Community Post Schema
const replySchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now }
});

const CommunityPost = mongoose.model('CommunityPost', postSchema);

module.exports = CommunityPost;
