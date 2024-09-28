import jwt from 'jsonwebtoken';

export function authMiddleware(req,res,next){
    try {
        const authHeader = req.headers.authorization;

        // Check if the header is provided and starts with 'Bearer '
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ message: 'Authorization header missing or malformed' });
        }

         // Extract the token from the header
        const token = authHeader.split(' ')[1];

        //verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
         // Add the userId to the request object
        req.userId = decoded.userId;
        next();
    } catch(err) {
        return res.status(403).json({message:'Invalid or expired token'})
    }
}

