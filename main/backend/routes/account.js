import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware.js';
import { Account, User } from '../db.js';

const router = express.Router();

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        // Find the account based on the authenticated user's ID
        const account = await Account.findOne({ userId: req.userId });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Find the user's details based on their ID
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the balance along with the username
        res.status(200).json({ balance: account.balance, username: user.username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/transfer', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { to, amount } = req.body;

        // Log input for debugging
        console.log(`Transfer request: from ${req.userId} to ${to}, amount: ${amount}`);

        // Fetch the account for the sender
        const account = await Account.findOne({ userId: req.userId }).session(session);
        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance or account not found' });
        }

        // Fetch the account for the recipient
        const toAccount = await Account.findOne({ userId: to }).session(session);
        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Recipient account not found' });
        }

        // Check for transferring to own account
        if (req.userId === to) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Cannot transfer money to your own account' });
        }

        // Perform the transfer
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

        // Complete the transaction
        await session.commitTransaction();
        session.endSession();
        res.json({
            message: "Transfer Successful"
        });
    } catch (err) {
        // Abort the transaction in case of error
        await session.abortTransaction();
        session.endSession();
        console.error("Error during transfer:", err);
        res.status(400).json({ message: err.message });
    } finally {
        // Ensure the session is ended
        session.endSession();
    }
});


export default router;