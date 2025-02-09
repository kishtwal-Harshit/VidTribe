
//require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'
dotenv.config({
  path: './env'
})

const port = process.env.port || 8000
connectDB()
.then(()=>{
  app.listen(port,()=>{
    console.log(`app running at : http://localhost:${port}`)
  })
})
.catch((err)=>{
  console.log("Mongo DB connection failed !!!",err)
})

















/*const app = express()

;(async ()=>{
  try{
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on("error",(error)=>{
      console.log("ERR: ",error)
      throw error
    })

    app.listen(process.env.PORT,()=>{
      console.log(`app running at : http://localhost:${process.env.PORT}`)
    })

  } catch(err){
    console.error("ERROR : ",err)
  }
})()*/