// models/License.js
import mongoose from 'mongoose';

const LicenseSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: [true, 'Please provide a license key'], 
    unique: true,
  },
  // We lock the key to the first machine that uses it
  hardwareId: { 
    type: String, 
    default: null 
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'expired'],
    default: 'active',
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  lastCheckIn: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.License || mongoose.model('License', LicenseSchema);