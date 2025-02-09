import mongoose,{Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({

  username : {
    type : String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email : {
    type : String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName : {
    type : String,
    required: true,
    trim: true,
    index: true,
  },
  avatar : {
    type : String, //cloudnary url
    required: true,
  },
  coverImage : {
    type : String,
  },
  watchHistory : [
    {
      type: Schema.Types.ObjectId,
      ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true,"Password is required"]
  },
  refreshToken:{
    type: String,
  }

},{timestapms:true})

userSchema.pre("save",async function(next){
  
  if(this.isModified("password") && (this.password = bcrypt.hash(this.password,10)))

  next()
})

userSchema.methods.isPasswordCorrect = async function(password){

  return await bcrypt.compare(password,this.password)
}

//generate access token-->no need for async
userSchema.methods.generateAccessToken = async function(){

    return await jwt.sign(
      {
        _id: this.id,
        email: this.email,
        username: this.username,
        fullName: this.fullName//->same as in db
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
    )
}

//generate refresh token-->no need for async
userSchema.methods.generateRefreshToken = async function()
{
  return await jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User",userSchema)