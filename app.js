import express from "express"
import cors from 'cors'
import { configDotenv } from "dotenv"
configDotenv()

import passport from "passport"

import { mainRouter } from './routes/mainRoutes.js'
import { authorRouter } from './routes/authorRoutes.js'

import './passport/local.js'
import './passport/jwt.js'


const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(passport.initialize())

app.use(cors({
    origin: ['https://bloggy-main.netlify.app', 'https://bloggy-author.netlify.app']
}))

app.use('/main', mainRouter)
app.use('/author', authorRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, (err) => {
    console.log(`Running on Port: ${PORT}`)
    if (err) throw err
})