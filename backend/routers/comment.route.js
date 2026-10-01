const express = require("express");
const {
	createComment,
	getComments,
	deleteComment
} = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth.middleware");

const commentRouter = express.Router();

commentRouter.get("/:id", getComments);
commentRouter.post("/:id", protect, createComment);
commentRouter.delete("/:commentId", protect, deleteComment);

module.exports = commentRouter;
