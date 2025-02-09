const asyncHandler = (requestHandler)=>{
  return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch(err=>console.log(err))
  }
}

export {asyncHandler}
// function func(){
//   console.log("indise promise\n");
// }

// //Promise.resolve(setTimeout(()=>func(),2000)).catch(err=>console.log(err))

// new Promise((resolve)=>{setTimeout(()=>func(),3000)}).catch(err=>console.log(err))