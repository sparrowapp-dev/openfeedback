import { Company, User } from '../models/index.js';
import bcrypt from 'bcryptjs';

/**
 * Seed script to create default admin and normal user.
 * This runs at API server startup if no users exist.
 */
export async function seedUsers(): Promise<void> {
  try {
    // Check if company already exists
    const existingCompany = await Company.findOne({ subdomain: 'demo' });
    
    if (existingCompany) {
      // Check if users already exist
      const userCount = await User.countDocuments({ companyID: existingCompany._id });
      if (userCount > 0) {
        console.log('📌 Seed users already exist, skipping...');
        return;
      }
    }

    console.log('🌱 Seeding initial users...');

    // Create or get demo company
    let company = existingCompany;
    let plainApiKey: string | null = null;
    
    if (!company) {
      // Generate API key using the model's static method
      const { plain, hash } = Company.generateApiKey();
      plainApiKey = plain;
      
      company = await Company.create({
        name: 'Demo Company',
        subdomain: 'demo',
        apiKey: plain,
        apiKeyHash: hash,
        domainWhitelist: ['localhost', 'localhost:5173'],
        plan: 'free',
      });
      console.log(`  ✓ Created demo company (API Key: ${plain})`);
    } else {
      // Get existing API key
      const companyWithKey = await Company.findById(company._id).select('+apiKey');
      plainApiKey = companyWithKey?.apiKey || null;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      companyID: company._id,
      userID: 'admin',
      name: 'Admin User',
      email: 'admin@demo.com',
      isAdmin: true,
      isShadow: false,
      customFields: {
        role: 'administrator',
        passwordHash: adminPassword,
      },
    });
    console.log('  ✓ Created admin user:');
    console.log('    Email: admin@demo.com');
    console.log('    Password: admin123');

    // Create normal user
    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await User.create({
      companyID: company._id,
      userID: 'user',
      name: 'Demo User',
      email: 'user@demo.com',
      isAdmin: false,
      isShadow: false,
      customFields: {
        role: 'user',
        passwordHash: userPassword,
      },
    });
    console.log('  ✓ Created normal user:');
    console.log('    Email: user@demo.com');
    console.log('    Password: user123');

    console.log('\n🔑 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:  admin@demo.com / admin123');
    console.log('User:   user@demo.com / user123');
    if (plainApiKey) {
      console.log(`API Key: ${plainApiKey}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    // Don't throw - allow server to continue even if seeding fails
  }
}
