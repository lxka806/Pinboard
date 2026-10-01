const Like = require("../models/like.model");
const Post = require("../models/post.model");

const likePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const existingLike = await Like.findOne({
            user: req.user.id,
            post: id
        });

        if (existingLike) {
            return res.status(400).json({
                message: "You already liked this post"
            });
        }

        const like = new Like({
            user: req.user.id,
            post: id
        });

        await like.save();

        return res.status(201).json({
            message: "Post liked successfully"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const unlikePost = async (req, res) => {
    try {
        const { id } = req.params;

        const like = await Like.findOne({
            user: req.user.id,
            post: id
        });

        if (!like) {
            return res.status(404).json({
                message: "Like not found"
            });
        }

        await like.deleteOne();

        return res.status(200).json({
            message: "Post unliked successfully"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getPostLikes = async (req, res) => {
    try {
        const likes = await Like.find({
            post: req.params.id
        }).populate("user", "username profilePicture");

        return res.status(200).json({
            count: likes.length,
            likes
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getLikedPosts = async (req, res) => {
    try {
        const userLikes = await Like.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate({
                path: "post",
                populate: { path: "user", select: "username profilePicture" }
            });
        const validLikes = userLikes.filter((like) => like.post);
        const postIds = validLikes.map((like) => like.post._id);
        const counts = postIds.length
            ? await Like.aggregate([
                { $match: { post: { $in: postIds } } },
                { $group: { _id: "$post", count: { $sum: 1 } } }
            ])
            : [];
        const countsByPost = new Map(counts.map((item) => [item._id.toString(), item.count]));

        const posts = validLikes.map((like) => ({
            ...like.post.toObject(),
            likedAt: like.createdAt,
            likesCount: countsByPost.get(like.post._id.toString()) || 0
        }));

        return res.status(200).json({ posts });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    likePost,
    unlikePost,
    getPostLikes,
    getLikedPosts
};