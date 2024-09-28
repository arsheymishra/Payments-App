import { Router } from "express";
import userRouter from "./user.js";
import accountRouter from './account.js'
const router = Router();


router.use("/user", userRouter);
router.use("/account",accountRouter);
//Define simple route
router.get("/", (req, res) => {
    res.send('Welcome to the API');
});



// Define more routes as needed
router.get('/users', (req, res) => {
    res.send('Get all users');
  });

export default router;