import mongoose from "mongoose";
import dotenv from 'dotenv';
import { number } from "zod";

dotenv.config(); // Load environment variables from .env file

// Replace with your actual MongoDB connection string
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});



//Define User Schema
const userSchema  = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
    },
    password : {
        type : String,
        required : true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    }
});

const accountSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId, //Reference to User model
        ref : "User",
        required : true
    },
        balance : {
            type : Number,
            required : true,
        }
});
const User = mongoose.model('User',userSchema);
const Account = mongoose.model('Account', accountSchema);

export { User, Account };