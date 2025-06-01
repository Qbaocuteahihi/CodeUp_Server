const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  videoUrl: String
}, { _id: false });

const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  lessons: [LessonSchema]
}, { _id: false });

// Cập nhật QuizQuestionSchema
const QuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  // Sửa thành correctAnswerIndex để khớp với frontend
  correctAnswerIndex: { type: Number, required: true } 
}, { _id: false });

const CourseDetailSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  duration: String,
  type: String,
  chapters: [ChapterSchema],
  quiz: [QuizQuestionSchema],
   
});

module.exports = mongoose.model("CourseDetail", CourseDetailSchema);