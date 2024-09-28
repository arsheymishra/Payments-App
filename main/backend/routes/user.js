import { Router } from 'express';
const router = Router();
import { User, Account } from '../db.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware.js';

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Zod schema for input validation
const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const parseUser = signupSchema.parse(req.body);
    const existingUser = await User.findOne({ email: parseUser.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parseUser.password, saltRounds);

    const newUser = new User({
      username: parseUser.username,
      email: parseUser.email,
      password: hashedPassword,
    });

    await newUser.save();

    const userId = newUser._id;
    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser._id, token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Zod schema for sign-in validation
const signinBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Signin route
router.post('/signin', async (req, res) => {
  try {
    const parsedData = signinBody.parse(req.body);

    const user = await User.findOne({ email: parsedData.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(parsedData.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Signed in successfully', token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get current user data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch the account associated with the user
    const account = await Account.findOne({ userId: user._id });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Add the balance to the user object and send it in the response
    const userData = {
      username: user.username,
      email: user.email,
      balance: account.balance, // Include balance from Account model
    };

    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const parsedData = updateUserSchema.parse(req.body);

    if (parsedData.password) {
      const saltRounds = 10;
      parsedData.password = await bcrypt.hash(parsedData.password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: parsedData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors });
    }
    res.status(500).json({ message: err.message });
  }
});

// Search users
// Search users (modification to hide user IDs)
router.get('/bulk', authMiddleware, async (req, res) => {
  try {
    const filter = req.query.filter;
    if (!filter) {
      return res.status(400).json({ message: 'Filter query parameter is required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: filter, $options: 'i' } },
        { email: { $regex: filter, $options: 'i' } },
      ],
    });

    res.json({
      users: users.map((user) => ({
        username: user.username,
        email: user.email,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;




// import { Router } from 'express';
// const router = Router();
// import { User, Account } from '../db.js';
// import { z } from 'zod';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// import {authMiddleware} from '../middleware.js'
// import dotenv from 'dotenv';
// dotenv.config();




// router.get('/',async (req,res)=>{
//    try{
//     const users = await User.find().select('-password');//fetch all user
//     res.json(users);
//    }catch (er){
//     res.status(500).json({message:er.message})
//    }
// });

// //zod schema for input validation
// const signupSchema = z.object({
//   username : z.string().min(3),
//   email : z.string().email(),
//   password : z.string().min(6),
// })


// // Define a route to create a new user
// router.post('/signup', async (req, res) => {
//     try {
//       const parseUser = signupSchema.parse(req.body);
//       //check if user already exists or not 
//       const existingUser = await User.findOne({email:parseUser.email});
//       if(existingUser){
//         res.status(411).json({message:'User already exists'});
//       }

//        // Hash the password
//     const saltRounds = 10; // Define the number of salt rounds
//     const hashedPassword = await bcrypt.hash(parseUser.password, saltRounds);


//       //create new user()
//       const newUser = new User({
//         username: parseUser.username,
//         email: parseUser.email,
//         password: hashedPassword,//store the hash password
//       });
//       await newUser.save();

//       const userId = newUser._id;
//       /// ----- Create new account ------
//       await Account.create({
//       userId,
//       balance: 1 + Math.random() * 10000
//       })
//       /// ----- -----

//       //generate JWT token for user with the userID
//       const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
//         expiresIn: '1h',
//       });


//        // Return the user ID and token
//       res.status(201).json({ message:'User created successfully',userId: newUser._id, token });
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
//   });

// // Define Zod schema for sign-in validation
// const signinBody = z.object({
//   email: z.string().email(),
//   password: z.string().min(6),
// });

// // Define a route to sign in an existing user
// router.post('/signin', async (req, res) => {
//   try {
//     // Validate request body
//     const parsedData = signinBody.parse(req.body);

//     // Find user by email
//     const user = await User.findOne({ email: parsedData.email });
//     console.log('Retrieved user:', user); // Debug: Check if user is retrieved
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Compare passwords
//     const isMatch = await bcrypt.compare(parsedData.password, user.password);
//     console.log('Password match:', isMatch); // Debug: Check password match
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Generate JWT token
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.status(200).json({ message: 'Signed in successfully', token });
//   } catch (err) {
//     // Handle validation and other errors
//     if (err instanceof z.ZodError) {
//       return res.status(400).json({ message: err.errors });
//     }
//     res.status(500).json({ message: err.message });
//   }
// });
// // // Define a route to get a specific user by ID
// // router.get('/:id', async (req, res) => {
// //     try {
// //       const user = await  User.findById(req.params.id).select('-password'); // Fetch user by ID
  
// //       if (!user) {
// //         return res.status(404).json({ message: 'User not found' });
// //       }
  
// //       res.json(user); // Respond with the user data
// //     } catch (err) {
// //       res.status(500).json({ message: err.message });
// //     }
// //   });

//   //zod schema fpr input valiidation
//   const updateUserSchema = z.object({
//     password: z.string().min(6).optional(),
//     username:z.string(3).optional(),
//   });

//   router.put('/',authMiddleware,async(req,res)=>{
//     try {
//       const parsedData = updateUserSchema.parse(req.body);

//       if(parsedData.password){
//         const saltRounds = 10;
//         parsedData.password = await bcrypt.hash(parsedData.password,saltRounds);
//       }
//     //update the user in database
//       const updatedUser = await User.findByIdAndUpdate(
//         req.userId,
//         { $set: parsedData },
//         { new: true, runValidators: true }
//       ).select('-password'); // Exclude the password from the response
//       if (!updatedUser) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       res.status(200).json({ message: 'User updated successfully', updatedUser });
//     }catch(err){
//       if (err instanceof z.ZodError) {
//         return res.status(411).json({ message: err.errors });
//       }
//       res.status(500).json({ message: err.message });
//     }
//   });

//   //Route to search account or username in the database 
//   router.get('/bulk',authMiddleware,async(req,res)=>{
//     try {
//       const filter = req.query.filter;

//       if(!filter){
//         return res.status(400).json({message:'Filter query parameter is reuired'})
//       }

//       const users = await User.find({
//         $or : [{
//           username: { $regex: filter, $options: 'i' },
//         },{
//           email : {$regex : filter , $options:'i'},
//         }]
//       })

//       res.json({
//         User : users.map(User=> ({
//           username : User.username,
//           email : User.email,
//           id : User._id
//         }))
//       })
//     } catch(err){
//       res.status(500).json({message:err.message})
//     }
//   });












































//   export default router; 