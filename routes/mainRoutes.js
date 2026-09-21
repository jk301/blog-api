import { Router } from 'express'
import {
    register, 
    login, 
    getAllPosts, 
    get4Posts, 
    getPost, 
    postComment, 
    editComment, 
    deleteOwnComment,
} from '../controllers/mainController.js'
import passport from 'passport'

export const mainRouter = Router()

mainRouter.post('/register', register)
mainRouter.get('/posts/lim', get4Posts)

mainRouter.post('/login', passport.authenticate('local', { session: false }), login)

// Protect jwt
mainRouter.get('/posts/all', passport.authenticate('jwt', { session: false }), getAllPosts)
mainRouter.get('/posts/:postId', passport.authenticate('jwt', { session: false }), getPost)
mainRouter.post('/posts/:postId/comments', passport.authenticate('jwt', { session: false }), postComment)
mainRouter.put('/posts/:postId/comments/:commentId/edit', passport.authenticate('jwt', { session: false }), editComment)
mainRouter.delete('/posts/:postId/comments/:commentId/delete', passport.authenticate('jwt', { session: false }), deleteOwnComment)