const Course = require("../models/Course");
const User = require("../models/User");

const CourseDetail = require("../models/CourseDetail");

exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate("instructor")
      .populate({
        path: "details",
        populate: {
          path: "chapters.lessons"
        }
      })
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để truy cập khóa học" });
    }

    const userId = req.user._id.toString();
    const isOwner = course.instructor._id.toString() === userId;
    const isEnrolled = course.enrolledUsers.some(
      (userIdInCourse) => userIdInCourse.toString() === userId
    );

    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ message: "Bạn cần mua khóa học để truy cập." });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết khóa học:", error);
    return res.status(500).json({ 
      message: "Lỗi server khi lấy chi tiết khóa học",
      error: error.message 
    });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      details, // details giờ đã bao gồm quiz
    } = req.body;

    const instructorId = req.user._id;

    let courseDetail = null;
    if (details) {
      // Tạo courseDetail từ details (đã bao gồm quiz)
      courseDetail = new CourseDetail(details);
      await courseDetail.save();
    }

    const course = new Course({
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      instructor: instructorId,
      details: courseDetail ? courseDetail._id : null,
      enrolledUsers: [instructorId],
    });

    await course.save();

    // Cập nhật thông tin người dùng (sử dụng User model thay vì Instructor)
    const instructor = await User.findById(instructorId);
    if (instructor) {
      // Đảm bảo các trường này tồn tại trong User schema
      instructor.numberOfCoursesCreated = (instructor.numberOfCoursesCreated || 0) + 1;
      
      if (!instructor.coursesTaught.includes(course._id)) {
        instructor.coursesTaught.push(course._id);
      }
      
      await instructor.save();
    }

    return res.status(201).json({ 
      message: "Khóa học đã được tạo thành công", 
      course,
      details: courseDetail
    });
  } catch (error) {
    console.error("Lỗi khi tạo khóa học:", error);
    return res.status(500).json({ 
      message: "Đã xảy ra lỗi khi tạo khóa học",
      error: error.message 
    });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({ message: "Không tìm thấy student hoặc khóa học" });
    }

    if (student.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ message: "Student đã đăng ký khóa học này" });
    }

    student.enrolledCourses.push(course._id);
    await student.save();

    if (!course.enrolledUsers.includes(student._id)) {
      course.enrolledUsers.push(student._id);
      await course.save();
    }

    return res.status(200).json({ message: "Đăng ký khóa học thành công" });
  } catch (error) {
    console.error("Lỗi khi đăng ký khóa học:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi đăng ký khóa học", error });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    await Course.findByIdAndDelete(courseId);

    const instructor = await Instructor.findById(course.instructor);
    if (instructor) {
      instructor.numberOfCoursesCreated -= 1;
      instructor.coursesTaught = instructor.coursesTaught.filter(
        (id) => id.toString() !== course._id.toString()
      );
      await instructor.save();
    }

    return res.status(200).json({ message: "Khóa học đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa khóa học:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi xóa khóa học", error });
  }
};

exports.getQuizByCourseId = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId).populate("details");
    if (!course || !course.details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết khóa học" });
    }

    return res.status(200).json({ quiz: course.details.quiz || [] });
  } catch (error) {
    console.error("Lỗi khi lấy quiz:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy quiz" });
  }
};

exports.createOrUpdateQuiz = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { quiz } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Tìm hoặc tạo CourseDetail
    let courseDetail = await CourseDetail.findOne({ courseId: course._id });

    if (!courseDetail) {
      courseDetail = new CourseDetail({ 
        courseId: course._id,
        quiz 
      });
    } else {
      courseDetail.quiz = quiz;
    }

    await courseDetail.save();

    // Cập nhật reference nếu chưa có
    if (!course.details) {
      course.details = courseDetail._id;
      await course.save();
    }

    return res.status(200).json({ 
      message: "Quiz đã được cập nhật", 
      quiz: courseDetail.quiz 
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quiz:", error);
    return res.status(500).json({ 
      message: "Lỗi server khi cập nhật quiz",
      error: error.message 
    });
  }
};