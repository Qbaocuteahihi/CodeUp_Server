import { CourseModel } from '~/models/Course';
import { LessonModel } from '~/models/Enrollment';
import { UserModel } from '~/models/User';

export const createCourse = async (req, res) => {
  const course = await CourseModel.create(req.body);
  res.status(201).json(course);
};

export const updateCourse = async (req, res) => {
  const course = await CourseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(course);
};

export const deleteCourse = async (req, res) => {
  await CourseModel.findByIdAndDelete(req.params.id);
  res.json({ message: 'Xóa khóa học thành công' });
};

export const addLesson = async (req, res) => {
  const lesson = await LessonModel.create(req.body);
  await CourseModel.findByIdAndUpdate(req.params.id, { $push: { lessons: lesson._id } });
  res.status(201).json(lesson);
};

export const getStatistics = async (req, res) => {
  const users = await UserModel.countDocuments();
  const courses = await CourseModel.countDocuments();
  const sales = await UserModel.aggregate([
    { $unwind: "$purchasedCourses" },
    { $group: { _id: null, total: { $sum: 1 } } }
  ]);
  res.json({ users, courses, totalCoursesSold: sales[0]?.total || 0 });
};