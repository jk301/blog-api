import { prisma } from '../lib/prisma.js'
import { passValid, genPass } from '../lib/utils.js'
import jwt from 'jsonwebtoken'

export async function register (req, res) {
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password

    if (!email || !username || !password) {
        return res.status(400).json({
            error: 'All input fields must me filled'
        })
    }

    try {
        const hashed = await genPass(password)

        await prisma.user.create({
            data: { email, username, hash: hashed }
        })

        return res.status(201).json({ message: 'User created' })
        
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Email is already taken.' })
        }
        console.log(err)
        return res.status(500).json({ error: 'Something went wrong.' })
    }
}

export function login (req, res) {
    // issue a jwt
    const user = req.user
    const payload = { id: user.id, email: user.email, username: user.username }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    return res.status(200).json({
        token
    })
}

export async function getAllPosts (req, res) {
    try {
        const allPost = await prisma.post.findMany()
        if (!allPost) return res.status(404).json({ error: "Posts are empty." })
        
        return res.status(200).json({ Posts: allPost })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function getPost (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)

    if (!postId || !userId) {
        return res.status(400).json({ error: "content or identifiers is missing." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId }, include: { comments: true } })
        if (!post) return res.status(404).json({ error: "Post not found." })
        
        return res.status(200).json({ Post: post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function postComment (req, res) {
    const postId = Number(req.params.postId)
    const userId = req.user.id
    const msgText = req.body.text

    if (!postId || !msgText || !userId) {
        return res.status(400).json({ error: "content or identifiers is missing." })
    }
    
    try {
        const post = await prisma.user.findUnique({ where: { id: userId } })
        await prisma.comment.create({ 
            data: { content: msgText, userId, name: post.username, postId }
        })
        res.status(201).json({ message: "Comment posted." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function editComment (req, res) {
    const postId = Number(req.params.postId)
    const commentId = Number(req.params.commentId)
    const userId = req.user.id
    const msgText = req.body.text

    if (!postId || !msgText || !userId || !commentId) {
        return res.status(400).json({ error: "content or identifiers is missing." })
    }
    
    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found." })

        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment) return res.status(404).json({ error: "Comment not found." })
        if (comment.userId !== userId) return res.status(403).json({ error: "Not your comment." })
        if (comment.postId !== post.id) return  res.status(400).json({ error: "Comment doesn't belong to this post." })

        await prisma.comment.update({
            data: { content: msgText }, 
            where: { id: commentId }
        })

        return res.status(200).json({ message: "Comment edited." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}


export async function deleteOwnComment (req, res) {
    const postId = Number(req.params.postId)
    const commentId = Number(req.params.commentId)
    const userId = req.user.id

    if (!postId ||  !userId || !commentId) {
        return res.status(400).json({ error: "content or identifiers is missing." })
    }
    
    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found." })

        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment) return res.status(404).json({ error: "Comment not found." })
        if (comment.userId !== userId) return res.status(403).json({ error: "Not your comment." })
        if (comment.postId !== post.id) return  res.status(400).json({ error: "Comment doesn't belong to this post." })

        await prisma.comment.delete({ where: { id: commentId } })

        return res.status(200).json({ message: "Comment deleted." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}