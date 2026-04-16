/**
 * Seed service packages data
 * This script populates the service_packages table with predefined packages
 */

const mysql = require('mysql2/promise');

async function seedPackages() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ktdevelop'
    });

    // Define service packages
    const packages = [
      {
        name: 'Basic Website',
        description: 'Perfect for startups and small businesses',
        base_price: 1500,
        features: JSON.stringify([
          '5-10 pages',
          'Responsive design',
          'Contact form',
          'Basic SEO',
          'Free hosting for 1 year',
          'Free email support'
        ]),
        sort_order: 1
      },
      {
        name: 'Business Website',
        description: 'Ideal for established companies',
        base_price: 3500,
        features: JSON.stringify([
          '15-30 pages',
          'Advanced SEO optimization',
          'Blog/News section',
          'Analytics integration',
          'Contact forms and inquiries',
          'Admin dashboard',
          'SSL certificate included',
          'Priority email support'
        ]),
        sort_order: 2
      },
      {
        name: 'E-Commerce Store',
        description: 'Complete online shop solution',
        base_price: 5500,
        features: JSON.stringify([
          'Unlimited products',
          'Payment gateway integration',
          'Inventory management',
          'Order management system',
          'Customer reviews',
          'Email notifications',
          'Admin dashboard',
          'Mobile app available',
          '24/7 phone support'
        ]),
        sort_order: 3
      },
      {
        name: 'Custom Web Application',
        description: 'Tailored solution for complex needs',
        base_price: 8000,
        features: JSON.stringify([
          'Custom development',
          'Database design',
          'API development',
          'User authentication',
          'Advanced reporting',
          'Full admin control',
          'Ongoing maintenance',
          'Dedicated account manager',
          'Training included'
        ]),
        sort_order: 4
      },
      {
        name: 'Mobile App Development',
        description: 'Native iOS and Android apps',
        base_price: 12000,
        features: JSON.stringify([
          'iOS app development',
          'Android app development',
          'Cross-platform compatibility',
          'Push notifications',
          'Offline functionality',
          'Backend API',
          'App store submission',
          'Performance optimization',
          '1 year free updates'
        ]),
        sort_order: 5
      }
    ];

    // Upsert packages
    for (const pkg of packages) {
      await connection.query(
        `INSERT INTO service_packages (name, description, base_price, features, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         base_price = VALUES(base_price),
         features = VALUES(features),
         sort_order = VALUES(sort_order),
         is_active = TRUE`,
        [pkg.name, pkg.description, pkg.base_price, pkg.features, pkg.sort_order]
      );
    }

    console.log('✓ Service packages seeded successfully');
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM service_packages');
    console.log(`Total packages: ${rows[0].count}`);
  } catch (error) {
    console.error('✗ Error seeding packages:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedPackages();
