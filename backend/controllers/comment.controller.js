const Comment = require("../models/comment.model");
const Post = require("../models/post.model");

const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { id } = req.params;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const comment = new Comment({
            content: content.trim(),
            user: req.user.id,
            post: id
        });

        await comment.save();

        await comment.populate("user", "username profilePicture");

        return res.status(201).json({
            message: "Comment created successfully",
            comment
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            post: req.params.id
        })
            .populate("user", "username profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            comments
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own comment"
            });
        }

        await comment.deleteOne();

        return res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment
};