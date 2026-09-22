import { prisma } from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

export async function authorLogin (req, res) {
    // issue a jwt
    const user = req.user
    try {
        const newUser = await prisma.user.update({
            data: {
                isAuthor: true
            }, where : {
                id : user.id
            }
        })

        const payload = { 
            id: newUser.id, 
            email: newUser.email, 
            username: newUser.username, 
            isAuthor: newUser.isAuthor 
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

        return res.status(200).json({
            token
        })
    } catch (error) {
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function getPosts (req, res) {
    const userId = req.user.id

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }
    
    try {
        const posts = await prisma.post.findMany({ where: { userId } })
        return res.status(200).json({ posts: posts })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function viewPost (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }
    
    try {
        const post = await prisma.post.findUnique({ where: { userId, id: postId }, include: { comments: true } })
        return res.status(200).json({ Post: post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function postUnpub (req, res) {
    const userId = req.user.id
    const title = req.body.title
    const content = req.body.content

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }

    if (!title || !content || !userId) {
        return res.status(400).json({ error: "content or identifiers is missing." })
    }
    
    try {
        await prisma.post.create({ data: { title, content, userId }})
        res.status(201).json({ message: "A unpublished post added." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}


export async function deletePost (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found" })
        if (post.userId !== userId) return res.status(403).json({ error: "Not your post" })

        await prisma.post.delete({ where: { id: postId }})

        return res.status(200).json({ message: "Post deleted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function editPost (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)
    const title = req.body.title
    const content = req.body.content

    if (!title || !content) {
        return res.status().json({ error: "Fields are empty" })
    }

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found" })
        if (post.userId !== userId) return res.status(403).json({ error: "Not your post" })

        await prisma.post.update({
            data: { title, content }, 
            where: { id: postId }
        })

        return res.status(200).json({ message: "Post edited." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}


export async function pushPub (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found" })
        if (post.userId !== userId) return res.status(403).json({ error: "Not your post" })

        await prisma.post.update({
            data: {
                isPub: true
            }, where: {
                id: postId
            }
        })

        return res.status(200).json({ message: "Added to publish" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}


export async function pullPub (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can create/change posts." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found" })
        if (post.userId !== userId) return res.status(403).json({ error: "Not your post" })

        await prisma.post.update({
            data: {
                isPub: false
            }, where: {
                id: postId
            }
        })

        return res.status(200).json({ message: "Removed from publish." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}

export async function deleteComment (req, res) {
    const userId = req.user.id
    const postId = Number(req.params.postId)
    const commentId = Number(req.params.commentId)

    if (!req.user.isAuthor) {
        return res.status(403).json({ error: "Only authors can delete others comment in their post." })
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: "Post not found." })
        if (post.userId !== userId) return res.status(403).json({ error: "Not your post." })

        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment) return res.status(404).json({ error: "Comment not found." })
        if (comment.postId !== post.id) return res.status(403).json({ error: "Comment not on your post." })

        await prisma.comment.delete({ where: { id: commentId } })

        return res.status(200).json({ message: "Comment deleted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong." })
    }
}
