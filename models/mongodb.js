const mongoose = require('mongoose');

// Create User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Topwear: { type: [String], required:true, default: [] },
    Bottomwear: { type: [String], required:true, default: [] },
    accessories: { type: [String], required:true, default: [] },
    personalItems: { type: [String], required:true, default: [] },
    favorites: { type: [String], required: true, default: [] }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return enteredPassword === this.password;
};

// Add a dress to the user's collection
userSchema.methods.addDress = async function (dress) {
    this.dresses.push(dress);
    await this.save(); // Save after adding the dress
};

// Remove a dress from the user's collection (optional)
userSchema.methods.removeDress = async function (dress) {
    this.dresses = this.dresses.filter(d => d !== dress);
    await this.save(); // Save after removing the dress
};

const User = mongoose.model('User', userSchema);

module.exports = User;
