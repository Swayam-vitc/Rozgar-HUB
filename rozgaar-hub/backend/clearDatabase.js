import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clearDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.collections();

        console.log(`\n📊 Found ${collections.length} collections to clear:\n`);

        // Delete all documents from each collection
        for (const collection of collections) {
            const count = await collection.countDocuments();
            await collection.deleteMany({});
            console.log(`   ✓ Cleared ${collection.collectionName}: ${count} documents deleted`);
        }

        console.log('\n✅ Database cleared successfully!\n');

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
};

// Run the cleanup
clearDatabase();
