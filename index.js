const { ApolloServer } = require('apollo-server-express');
const { gql } = require('graphql-tag');
const express = require('express');
const mongoose = require('mongoose');
// const { startStandaloneServer } = require('@apollo/server/standalone');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const MONGODB = 'mongodb+srv://root:root@cluster0.axpr6ia.mongodb.net/myapplication';

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

const accountSid = 'ACb87f2f264cecfe20600768dab95818dd';
const authToken = '1ac12519d333d38e12c85bcfebbd24e1';
const twilioClient = require('twilio')(accountSid, authToken);

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

const typeDefs = gql`
  type Query {
    hello: String
    getUser(phoneNumber: String!): User
  }

  type Mutation {
    initiatePhoneAuthentication(phoneNumber: String!): String
    initiateEmailAuthentication(email: String!): String
    verifyPhoneAuthentication(phoneNumber: String!, verificationCode: String!): String
    verifyEmailAuthentication(email: String!, verificationCode: String!): String
    createUser(input: UserInput): User
    updateUser(phoneNumber: String!, input: UserInput): User
    deleteUser(phoneNumber: String!): User
  }

  input UserInput {
    phoneNumber: String!
    firstName: String
    lastName: String
    dob: String
    gender: String
    weight: Float
    height: Float
  }

  type User {
    phoneNumber: String
    verificationCode: String
    firstName: String
    lastName: String
    dob: String
    gender: String
    weight: Float
    height: Float
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, GraphQL!',
    getUser: async (_, { phoneNumber }) => User.findOne({ phoneNumber })
  },
  Mutation: {
    initiatePhoneAuthentication: async (_, { phoneNumber }) => {
      const user = await User.findOne({ phoneNumber });
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

      if (!user) {
        await User.create({ phoneNumber, verificationCode, verificationCodeTimestamp: new Date() });
      } else {
        await User.findOneAndUpdate({ phoneNumber }, { verificationCode, verificationCodeTimestamp: new Date() });
      }

      try {
        await twilioClient.messages.create({
          body: `Your verification code is: ${verificationCode}`,
          to: phoneNumber,
          from: '+14403055697'
        });
        console.log(`Verification code sent to ${phoneNumber}`);
      } catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send verification code: ' + error.message);
      }

      return jwt.sign({ phoneNumber, verificationCode }, JWT_SECRET);
    },
    verifyPhoneAuthentication: async (_, { phoneNumber, verificationCode }) => {
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

      return jwt.sign({ phoneNumber, verificationCode }, JWT_SECRET);
    },
   
    initiateEmailAuthentication: async (_, { email }) => {
      try {
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({ email });
        }

        const currentTime = new Date();
        const timeLimitInMinutes = 5;
        const expirationTime = new Date(currentTime.getTime() + timeLimitInMinutes * 60000);

        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        user.emailVerificationCode = verificationCode;
        user.emailVerificationCodeExpiration = expirationTime;
        await user.save();

        const mailOptions = {
          from: 'naidugudivada767@gmail.com',
          to: email,
          subject: 'Email Verification Code',
          text: `Your email verification code is: ${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email verification code sent to ${email}`);
        console.log(`Code expires at: ${expirationTime}`);

        return 'Email verification code sent successfully';
      } catch (error) {
        console.error('Error initiating email authentication:', error);
        throw new Error('Failed to initiate email authentication');
      }
    },

    verifyEmailAuthentication: async (_, { email, verificationCode }) => {
      try {
        const user = await User.findOne({ email });

        if (!user || user.emailVerificationCode !== verificationCode) {
          throw new Error('Invalid verification code');
        }

        const currentTime = new Date();
        if (user.emailVerificationCodeExpiration && currentTime > user.emailVerificationCodeExpiration) {
          throw new Error('Email verification code has expired');
        }

        user.emailVerificationCode = null;
        user.emailVerificationCodeExpiration = null;
        await user.save();

        return 'Email verification successful';
      } catch (error) {
        console.error('Error verifying email authentication:', error);
        throw new Error('Failed to verify email authentication');
      }
    },
    createUser: async (_, { input }) => {
      const user = await User.create(input);
      return user;
    },
    updateUser: async (_, { phoneNumber, input }) => {
      const user = await User.findOneAndUpdate({ phoneNumber }, input, { new: true });
      return user;
    },
    deleteUser: async (_, { phoneNumber }) => {
      const user = await User.findOneAndDelete({ phoneNumber });
      return user;
    }
  }
};

// async function startServer() {
//   try {
//     await mongoose.connect(MONGODB, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log('Connected to MongoDB');

//     const server = new ApolloServer({ typeDefs, resolvers });
//     const app = express();

//     const { url } = await startStandaloneServer(server);

//     console.log(`Server ready at ${url}`);
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//   }
// }

// async function startServer() {
//   try {
//     await mongoose.connect(MONGODB, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log('Connected to MongoDB');

//     const server = new ApolloServer({ typeDefs, resolvers });
//     const app = express();

//     const { url } = await startStandaloneServer(server);

//     const PORT = process.env.PORT || 4000;

//     app.listen(PORT, () => {
//       console.log(`Server ready at ${url}`);
//     });
//   } catch (error) {
//     console.error('Error connecting to MongoDB or starting server:', error);
//   }
// }

// ... (your existing imports)

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create an Apollo Server instance
    const server = new ApolloServer({ typeDefs, resolvers, playground: true });
    const app = express();

    // Start the Apollo Server
    await server.start();

    // Apply Apollo Server middleware to Express
    server.applyMiddleware({ app });

    // Define a catch-all route for any other path
    app.get('*', (req, res) => {
      res.send('Apollo Server is running. Use GraphQL endpoint at ' + server.graphqlPath);
    });

    // Set the port for Heroku deployment or default to 4000
    const PORT = process.env.PORT || 4000;

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1); // Exit the process with an error code
  }
}

// Start the server
startServer().catch((err) => {
  console.error('Error starting server:', err);
});


// const express = require("express");
// const app = express();
// const port = process.env.PORT || 3001;

// app.get("/", (req, res) => res.type('html').send(html));

// const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// server.keepAliveTimeout = 120 * 1000;
// server.headersTimeout = 120 * 1000;

// const html = `
// <!DOCTYPE html>
// <html>
//   <head>
//     <title>Hello from Render!</title>
//     <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
//     <script>
//       setTimeout(() => {
//         confetti({
//           particleCount: 100,
//           spread: 70,
//           origin: { y: 0.6 },
//           disableForReducedMotion: true
//         });
//       }, 500);
//     </script>
//     <style>
//       @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
//       @font-face {
//         font-family: "neo-sans";
//         src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
//         font-style: normal;
//         font-weight: 700;
//       }
//       html {
//         font-family: neo-sans;
//         font-weight: 700;
//         font-size: calc(62rem / 16);
//       }
//       body {
//         background: white;
//       }
//       section {
//         border-radius: 1em;
//         padding: 1em;
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         margin-right: -50%;
//         transform: translate(-50%, -50%);
//       }
//     </style>
//   </head>
//   <body>
//     <section>
//       Hello from Render!
//     </section>
//   </body>
// </html>`;

