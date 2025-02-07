import cors from 'cors'
import path from 'path'
import checkDBConnection from './DB/connectionDB.js'
import userRouter from './modules/user/user.controller.js'
import { globalErrorHandling } from './utils/index.js'
import postRouter from './modules/post/post.controller.js'
import commentRouter from './modules/comment/comment.controller.js'
import {rateLimit} from 'express-rate-limit'
const limiter=rateLimit({
    limit:5,
    windowMs:60*1000,
    handler:(req,res,next)=>{
        return next(new Error('Too many requests. Please slow down and try again later.',{cause:429}))
    }

})
const bootstrap=(app,express)=>{
    app.use(cors())
    app.use(limiter)
    app.use('/uploads',express.static(path.resolve('uploads')))

    app.use(express.json())
    checkDBConnection()
    app.use('/users',userRouter)
    app.use('/posts',postRouter)
    app.use('/comments',commentRouter)


    app.get('/',(req,res,next)=>{
        return res.status(200).json({message:"Welcome To My Social Media App"})
    })
    app.use('*',(req,res,next)=>{
        return next(new Error('Page Not Found 404 !',{cause:404}))
    })
    app.use(globalErrorHandling)


}
export default bootstrap