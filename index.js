// const { ApolloServer } = require('apollo-server-express');
// const { gql } = require('graphql-tag');
// const express = require('express');
// const mongoose = require('mongoose');
// // const { startStandaloneServer } = require('@apollo/server/standalone');
// const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken');

// const MONGODB = 'mongodb+srv://root:root@cluster0.axpr6ia.mongodb.net/myapplication';

// const User = mongoose.model('User', {
//   phoneNumber: String,
//   verificationCode: String,
//   verificationCodeTimestamp: Date,
//   email: String,
//   emailVerificationCode: String,
//   emailVerificationCodeExpiration: Date,
//   firstName: String,
//   lastName: String,
//   dob: Date,
//   gender: String,
//   weight: Number,
//   height: Number
// });

// const accountSid = 'ACb87f2f264cecfe20600768dab95818dd';
// const authToken = '9bf3b49f8d10b159efad7e69985cf751';
// const twilioClient = require('twilio')(accountSid, authToken);

// const JWT_SECRET = 'AeX$34#90dskRtMdfgPLjmnQ13@';

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: 'naidugudivada768@gmail.com',
//     pass: 'urve whsp akow izgz'
//   }
// });

// const typeDefs = gql`
//   type Query {
//     hello: String
//     getUser(phoneNumber: String!): User
//   }

//   type Mutation {
//     initiatePhoneAuthentication(phoneNumber: String!): String
//     initiateEmailAuthentication(email: String!): String
//     verifyPhoneAuthentication(phoneNumber: String!, verificationCode: String!): String
//     verifyEmailAuthentication(email: String!, verificationCode: String!): String
//     createUser(input: UserInput): User
//     updateUser(phoneNumber: String!, input: UserInput): User
//     deleteUser(phoneNumber: String!): User
//   }

//   input UserInput {
//     phoneNumber: String!
//     firstName: String
//     lastName: String
//     dob: String
//     gender: String
//     weight: Float
//     height: Float
//   }

//   type User {
//     phoneNumber: String
//     verificationCode: String
//     firstName: String
//     lastName: String
//     dob: String
//     gender: String
//     weight: Float
//     height: Float
//   }
// `;

// const resolvers = {
//   Query: {
//     hello: () => 'Hello, GraphQL!',
//     getUser: async (_, { phoneNumber }) => User.findOne({ phoneNumber })
//   },
//   Mutation: {
//     initiatePhoneAuthentication: async (_, { phoneNumber }) => {
//       const user = await User.findOne({ phoneNumber });
//       const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

//       if (!user) {
//         await User.create({ phoneNumber, verificationCode, verificationCodeTimestamp: new Date() });
//       } else {
//         await User.findOneAndUpdate({ phoneNumber }, { verificationCode, verificationCodeTimestamp: new Date() });
//       }

//       try {
//         await twilioClient.messages.create({
//           body: `Your verification code is: ${verificationCode}`,
//           to: phoneNumber,
//           from: '+14403055697'
//         });
//         console.log(`Verification code sent to ${phoneNumber}`);
//       } catch (error) {
//         console.error('Error sending SMS:', error);
//         throw new Error('Failed to send verification code: ' + error.message);
//       }

//       return jwt.sign({ phoneNumber, verificationCode }, JWT_SECRET);
//     },
//     verifyPhoneAuthentication: async (_, { phoneNumber, verificationCode }) => {
//       const user = await User.findOne({ phoneNumber });

//       if (!user || user.verificationCode !== verificationCode) {
//         throw new Error('Invalid verification code');
//       }

//       const timeLimitInMinutes = 5;
//       const currentTime = new Date();
//       const timeDiff = Math.abs(currentTime - user.verificationCodeTimestamp) / (1000 * 60);

//       if (timeDiff > timeLimitInMinutes) {
//         throw new Error('Verification code has expired');
//       }

//       return jwt.sign({ phoneNumber, verificationCode }, JWT_SECRET);
//     },
   
//     initiateEmailAuthentication: async (_, { email }) => {
//       try {
//         let user = await User.findOne({ email });

//         if (!user) {
//           user = await User.create({ email });
//         }

//         const currentTime = new Date();
//         const timeLimitInMinutes = 5;
//         const expirationTime = new Date(currentTime.getTime() + timeLimitInMinutes * 60000);

//         const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//         user.emailVerificationCode = verificationCode;
//         user.emailVerificationCodeExpiration = expirationTime;
//         await user.save();

//         const mailOptions = {
//           from: 'naidugudivada767@gmail.com',
//           to: email,
//           subject: 'Email Verification Code',
//           text: `Your email verification code is: ${verificationCode}`,
//         };

//         await transporter.sendMail(mailOptions);
//          // Return the verification code
//      return verificationCode;
//         console.log(`Email verification code sent to ${email}`);
//         console.log(`Code expires at: ${expirationTime}`);
//       } catch (error) {
//         console.error('Error initiating email authentication:', error);
//         throw new Error('Failed to initiate email authentication');
//       }
//     },

//     verifyEmailAuthentication: async (_, { email, verificationCode }) => {
//       try {
//         const user = await User.findOne({ email });

//         if (!user || user.emailVerificationCode !== verificationCode) {
//           throw new Error('Invalid verification code');
//         }

//         const currentTime = new Date();
//         if (user.emailVerificationCodeExpiration && currentTime > user.emailVerificationCodeExpiration) {
//           throw new Error('Email verification code has expired');
//         }

//         user.emailVerificationCode = null;
//         user.emailVerificationCodeExpiration = null;
//         await user.save();

//         return 'Email verification successful';
//       } catch (error) {
//         console.error('Error verifying email authentication:', error);
//         throw new Error('Failed to verify email authentication');
//       }
//     },
//     createUser: async (_, { input }) => {
//       const user = await User.create(input);
//       return user;
//     },
//     updateUser: async (_, { phoneNumber, input }) => {
//       const user = await User.findOneAndUpdate({ phoneNumber }, input, { new: true });
//       return user;
//     },
//     deleteUser: async (_, { phoneNumber }) => {
//       const user = await User.findOneAndDelete({ phoneNumber });
//       return user;
//     }
//   }
// };

// // async function startServer() {
// //   try {
// //     await mongoose.connect(MONGODB, {
// //       useNewUrlParser: true,
// //       useUnifiedTopology: true,
// //     });

// //     console.log('Connected to MongoDB');

// //     const server = new ApolloServer({ typeDefs, resolvers });
// //     const app = express();

// //     const { url } = await startStandaloneServer(server);

// //     console.log(`Server ready at ${url}`);
// //   } catch (error) {
// //     console.error('Error connecting to MongoDB:', error);
// //   }
// // }

// // async function startServer() {
// //   try {
// //     await mongoose.connect(MONGODB, {
// //       useNewUrlParser: true,
// //       useUnifiedTopology: true,
// //     });

// //     console.log('Connected to MongoDB');

// //     const server = new ApolloServer({ typeDefs, resolvers });
// //     const app = express();

// //     const { url } = await startStandaloneServer(server);

// //     const PORT = process.env.PORT || 4000;

// //     app.listen(PORT, () => {
// //       console.log(`Server ready at ${url}`);
// //     });
// //   } catch (error) {
// //     console.error('Error connecting to MongoDB or starting server:', error);
// //   }
// // }

// // ... (your existing imports)

// async function startServer() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(MONGODB, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log('Connected to MongoDB');

//     // Create an Apollo Server instance
//     const server = new ApolloServer({ typeDefs, resolvers, playground: true });
//     const app = express();

//     // Start the Apollo Server
//     await server.start();

//     // Apply Apollo Server middleware to Express
//     server.applyMiddleware({ app });

//     // Define a catch-all route for any other path
//     app.get('*', (req, res) => {
//       res.send('Apollo Server is running. Use GraphQL endpoint at ' + server.graphqlPath);
//     });

//     // Set the port for Heroku deployment or default to 4000
//     const PORT = process.env.PORT || 4000;

//     // Start the Express server
//     app.listen(PORT, () => {
//       console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
//     });
//   } catch (error) {
//     console.error('Error:', error.message);
//     process.exit(1); // Exit the process with an error code
//   }
// }

// // Start the server
// startServer().catch((err) => {
//   console.error('Error starting server:', err);
// });

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGODB = 'mongodb+srv://root:root@cluster0.axpr6ia.mongodb.net/myapplication';

mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });
const User = mongoose.model('User', {
  phoneNumber: String,
  verificationCode: String,
  verificationCodeTimestamp: Date,
  email: String,
  emailVerificationCode: String,
  emailVerificationCodeExpiration: Date,
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  weight: Number,
  height: Number
});

const JWT_SECRET = 'AeX$34#90dskRtMdfgPLjmnQ13@';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'naidugudivada768@gmail.com',
    pass: 'urve whsp akow izgz'
  }
});

// RESTful API Endpoints

// User registration (Create a new user)
app.post('/api/user', async (req, res) => {
  const userData = req.body;
  try {
    const user = await User.create(userData);
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User login with mobile number
app.post('/api/user/login/mobile', async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });

    if (!user || user.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    const timeLimitInMinutes = 5;
    const currentTime = new Date();
    const timeDiff = Math.abs(currentTime - user.verificationCodeTimestamp) / (1000 * 60);

    if (timeDiff > timeLimitInMinutes) {
      throw new Error('Verification code has expired');
    }

    // If login is successful, you can generate and return a JWT token
    const token = jwt.sign({ phoneNumber }, JWT_SECRET);

    res.json({ message: 'Mobile login successful', token });
  } catch (error) {
    console.error('Error with mobile login:', error);
    res.status(400).json({ error: error.message });
  }
});

// User login with email
app.post('/api/user/login/email', async (req, res) => {
  const { email, emailVerificationCode } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user || user.emailVerificationCode !== emailVerificationCode) {
      throw new Error('Invalid verification code');
    }

    const currentTime = new Date();
    if (user.emailVerificationCodeExpiration && currentTime > user.emailVerificationCodeExpiration) {
      throw new Error('Email verification code has expired');
    }

    // If login is successful, you can generate and return a JWT token
    const token = jwt.sign({ email }, JWT_SECRET);

    res.json({ message: 'Email login successful', token });
  } catch (error) {
    console.error('Error with email login:', error);
    res.status(400).json({ error: error.message });
  }
});

// Read all users
app.get('/api/user', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Read a specific user by phoneNumber
app.get('/api/user/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  try {
    const user = await User.findOne({ phoneNumber });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a specific user by phoneNumber
app.put('/api/user/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  const userData = req.body;
  try {
    const user = await User.findOneAndUpdate({ phoneNumber }, userData, { new: true });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a specific user by phoneNumber
app.delete('/api/user/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  try {
    const user = await User.findOneAndDelete({ phoneNumber });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


