import express, { json } from "express";
import cors from 'cors';
import apiRouter from './routes/index.js'; // Import the router
const app = express();

// Middleware to parse JSON
app.use(json());
//cors middleware to allow access to frontend
app.use(cors());//allow all domains means any domain can hit request from this api 

// *For specific domain to hit this api*
// app.use(cors({
//   origin: 'https://example.com', // Allow only this domain
//   methods: ['GET', 'POST'],      // Allow only specific methods
//   credentials: true              // Allow credentials
// }));

// Route all requests starting with /api/v1 to the apiRouter
app.use("/api/v1", apiRouter);

// Define the port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});