require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const SEED_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || 'instaprints@gmail.com';
const SEED_PASSWORD_PLAIN = 'Instaprints@2026';
const BCRYPT_SALT_ROUNDS = 12;

const seedSingleAdmin = async () => {
  try {
    console.log('[Seed] Initializing Admin account setup...');
    await connectDB();

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD_PLAIN, BCRYPT_SALT_ROUNDS);

    // Remove any previous admin records to guarantee exactly one fixed admin
    await Admin.deleteMany({});
    
    await Admin.create({
      email: SEED_EMAIL.toLowerCase(),
      password: hashedPassword,
      lastLoginAt: null
    });
    
    console.log(`[Seed] Successfully created single fixed admin account: ${SEED_EMAIL}`);
    console.log('[Seed] Admin account is ready with bcrypt cost factor 12.');
    console.log('[Seed] Database is strictly locked to this single record.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
};

seedSingleAdmin();
