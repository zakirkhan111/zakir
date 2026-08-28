const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Atlas retains old indexes after a schema change. Remove the legacy GeoJSON
    // index so malformed historic documents cannot reject otherwise valid writes.
    try {
      const projects = conn.connection.collection('projects');
      const indexes = await projects.listIndexes().toArray();
      const legacyGeoIndexes = indexes.filter((index) => index.key?.['location.coordinates'] === '2dsphere');
      await Promise.all(legacyGeoIndexes.map((index) => projects.dropIndex(index.name)));
    } catch (indexError) {
      // A new/empty deployment can have no projects collection or no legacy index.
      if (!['IndexNotFound', 'NamespaceNotFound'].includes(indexError.codeName)) throw indexError;
    }
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
