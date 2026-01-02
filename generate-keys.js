// generate-keys.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const crypto = require('crypto');

// 1. Define the License Schema (Must match your server model)
const LicenseSchema = new mongoose.Schema({
    key: String,
    hardwareId: { type: String, default: null },
    status: { type: String, default: 'active' },
    expiryDate: Date,
    licenseType: String, // 'standard', 'premium', 'trial'
    email: String        // Optional: Assign to specific email if known
});

const License = mongoose.models.License || mongoose.model('License', LicenseSchema);

// 2. Configuration
const BATCH_SIZE = 1;          // How many keys to generate?
const DAYS_VALID = 365;        // How long is the license valid?
const TYPE = 'premium';        // 'standard' or 'premium'
const PREFIX = 'PRO';          // Key prefix (e.g., PRO-XXXX...)

// 3. Helper to create a random readable key (XXXX-XXXX-XXXX-XXXX)
function generateRandomKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 (confusing chars)
    let key = '';
    
    // Generate 4 groups of 4 characters
    for (let i = 0; i < 4; i++) {
        let chunk = '';
        for (let j = 0; j < 4; j++) {
            chunk += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        key += chunk + (i < 3 ? '-' : '');
    }
    return `${PREFIX}-${key}`;
}

// 4. Main Execution
async function main() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ Error: MONGODB_URI not found in .env.local");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + DAYS_VALID);

        console.log(`\nGenerating ${BATCH_SIZE} ${TYPE} keys (Valid for ${DAYS_VALID} days)...\n`);
        console.log("===========================================");

        for (let i = 0; i < BATCH_SIZE; i++) {
            const key = generateRandomKey();
            
            await License.create({
                key: key,
                status: 'active',
                expiryDate: expiryDate,
                licenseType: TYPE,
                hardwareId: null // Unlocked, waiting for first user
            });

            console.log(`🔑 ${key}`);
        }

        console.log("===========================================");
        console.log("\n✅ Keys saved to database! You can now send these to users.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

main();