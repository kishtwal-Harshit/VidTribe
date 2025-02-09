import mongoose from 'mongoose';
import { DB_NAME } from "../constants.js";
/*import dotenv from 'dotenv'


dotenv.config({
  path: './env'
})*/
//console.log(DB_NAME)
//console.log(process.env.PORT)
//console.log('MONGODB_URI:', process.env.MONGODB_URI);
const connectDB = async () => {
  try {
    console.log('here');
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB connected!! DB Host: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.log('MONGODB connection error', err);
    process.exit(1);
  }
};
//connectDB()
export default connectDB;