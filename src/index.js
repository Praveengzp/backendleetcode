const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')

// console.log("Hello")

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);


const initializeConnections = async () => {
    const results = await Promise.allSettled([main(), redisClient.connect()]);

    if (results[0].status === "fulfilled") {
        console.log("MongoDB connected");
    } else {
        console.error("MongoDB connection failed:", results[0].reason);
    }

    if (results[1].status === "fulfilled") {
        console.log("Redis connected");
    } else {
        console.error("Redis connection failed:", results[1].reason);
    }
};

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

initializeConnections().finally(() => {
    app.listen(PORT, HOST, () => {
        console.log("Server listening at port number: " + PORT);
    });
});
