const mongoose = require("mongoose");

// Mỗi bài học/phần trong một chương
const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Tên phần/bài học
  content: String,                               // Nội dung text
  videoUrl: String                               // Link video
}, { _id: false });

// Mỗi chương có nhiều bài học
const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Tên chương
  description: String,                           // Mô tả chương
  lessons: [LessonSchema]                        // Danh sách phần/bài học
}, { _id: false });

// Schema chi tiết của khóa học (CourseDetail)
const CourseDetailSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  duration: String,                              // Tổng thời lượng
  type: String,                                   // Loại khóa học: Video/Text/Combo
  chapters: [ChapterSchema]                      // Danh sách chương
});

module.exports = mongoose.model("CourseDetail", CourseDetailSchema);
