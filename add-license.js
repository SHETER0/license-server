// To run this: node scripts/add-license.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Simple schema definition for the script
const LicenseSchema = new mongoose.Schema({
    key: String, hardwareId: String, status: String, expiryDate: Date
});
const License = mongoose.model('License', LicenseSchema);
    console.log(process.env.MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI).then(async () => {

    console.log("Connected. Creating license...");

    await License.create({
        key: "TEST-KEY-12345",
        hardwareId: null, // Null means "bind to the first PC that connects"
        status: "active",
        expiryDate: new Date("2026-12-31")
    });

    console.log("License created!");
    process.exit();
});