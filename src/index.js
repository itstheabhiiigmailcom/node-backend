import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
  path: "./.env",
});

// import and run connectDB it will return promise
connectDB()
.then(()=> {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Mongo connection Failed !!! ", err)
})




/*      approach to do evrything in index.js
import express from 'express'
const app = express()

// iffe function with async
( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("My express is not eble to talk with db")
            throw err
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on ${process.env.PORT}`)
        })

    }catch(error) {
        console.log("ERROR: ", error)
        throw error
    }
})() */
