const Post = require("../models/post.model");
const Like = require("../models/like.model");
const Comment = require("../models/comment.model");
const POST_CATEGORIES = ["Photography", "Travel", "Food", "Design", "Nature", "Technology", "Other"];

const includePostEngagement = async (posts) => {
    if (posts.length === 0) {
        return [];
    }

    const postIds = posts.map((post) => post._id);
    const [likes, comments] = await Promise.all([
        Like.find({ post: { $in: postIds } }).populate("user", "username profilePicture"),
        Comment.find({ post: { $in: postIds } })
            .populate("user", "username profilePicture")
            .sort({ createdAt: -1 })
    ]);

    const likesByPost = new Map();
    const commentsByPost = new Map();

    for (const like of likes) {
        const postId = like.post.toString();
        likesByPost.set(postId, [...(likesByPost.get(postId) || []), like]);
    }

    for (const comment of comments) {
        const postId = comment.post.toString();
        commentsByPost.set(postId, [...(commentsByPost.get(postId) || []), comment]);
    }

    return posts.map((post) => {
        const postId = post._id.toString();
        const postLikes = likesByPost.get(postId) || [];
        const postComments = commentsByPost.get(postId) || [];

        return {
            ...post.toObject(),
            likes: postLikes,
            likesCount: postLikes.length,
            comments: postComments,
            commentsCount: postComments.length
        };
    });
};

const createPost = async (req, res) => {
    try {
        const { title, description, image } = req.body;
        const category = req.body.category || "Other";

        if (!title || !image) {
            return res.status(400).json({
                message: "Title and image are required"
            });
        }

        if (!POST_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: "Invalid post category" });
        }

        const post = new Post({
            title,
            description,
            image,
            category,
            user: req.user.id
        });

        await post.save();

        return res.status(201).json({
            message: "Post created successfully",
            post
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "username profilePicture")
            .sort({ createdAt: -1 });
        const postsWithEngagement = await includePostEngagement(posts);

        return res.status(200).json({
            posts: postsWithEngagement
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("user", "username profilePicture");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const [postWithEngagement] = await includePostEngagement([post]);

        return res.status(200).json({
            post: postWithEngagement
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updatePost = async (req, res) => {
    try {
        const { title, description, image, category } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only edit your own post"
            });
        }

        if (category && !POST_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: "Invalid post category" });
        }

        post.title = title || post.title;
        post.description = description || post.description;
        post.image = image || post.image;
        post.category = category || post.category;

        await post.save();

        return res.status(200).json({
            message: "Post updated successfully",
            post
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own post"
            });
        }

        await post.deleteOne();

        return res.status(200).json({
            message: "Post deleted successfully"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost
};