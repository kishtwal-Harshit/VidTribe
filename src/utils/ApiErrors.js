class ApiErrors extends Error{
  constructor(
    statusCode,
    message="Something went wrong!",
    errors=[],
    errStack = ""
  ){
    super(message) //override parent class
    this.statusCode = statusCode
    this.data=null
    this.message = message
    this.sucess = false
    this.errors = errors

    if(errStack){
      this.stack=errStack
    }
    else{
      //gives error
      Error.captureStackTrace(this,this.constructor)
    }

  }
}

export {ApiErrors}