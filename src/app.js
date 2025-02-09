import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()
 
app.use(cors({
  origon: process.env.CORS_ORIGON,
  credentials: true,
}))
app.use(express.json({limit:"16kb"}))
app.use(urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import { router } from './routes/user.routes.js'

//router declaration
app.use("/api/v1/users",router)
export {app}