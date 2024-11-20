import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// configure cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))      // to accept json data
app.use(express.urlencoded({extended: true, limit: "16kb"}))        
app.use(express.static("public"))
app.use(cookieParser())     //  a software library that extracts cookie data from HTTP requests and makes it available to the server-side code



// routes import
import userRouter from './routes/user.routes.js'



// routes declaration
app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/v1/users/register


export { app }