import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new mongoose.Schema({

  subscriber:{//one who's subscribing
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  channel: {  //one whom 'subscriber 'is subscribing to
    type: Schema.Types.ObjectId,
    ref: "User"
  },
},{timestamps:true})


export const Subscription = mongoose.model("Subscription",subscriptionSchema)