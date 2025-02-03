import env from 'dotenv'
import express from 'express'
import bootstrap from './src/app.controller.js'
env.config()
const app=express()
const port=process.env.PORT||3000

bootstrap(app,express)
app.listen(port,()=>{
    console.log(`Server is Running On Port ${port}`);
    
})