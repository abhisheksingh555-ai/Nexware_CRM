require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB(process.env.MONGO_URI);
  const server = http.createServer(app);
  server.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
})();

// require('dotenv').config();
// const app = require('./app');
// const connectDB = require('./config/db');

// let isDBConnected = false;

// async function ensureDBConnection() {
//   if (!isDBConnected) {
//     await connectDB(process.env.MONGO_URI);
//     isDBConnected = true;
//   }
// }
// module.exports = async (req, res) => {
//   await ensureDBConnection(); 
//   return app(req, res);       
// };
