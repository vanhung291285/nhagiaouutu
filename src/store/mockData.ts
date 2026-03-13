export const mockCandidate = {
  name: "Nguyễn Văn A",
  subtitle: "Ứng viên đề nghị xét tặng danh hiệu \"Nhà giáo Ưu Tú\"",
  dob: "1975-05-15",
  position: "Hiệu trưởng",
  unit: "Trường THPT Chuyên Lê Hồng Phong",
  yearsOfWork: 25,
  qualifications: "Tiến sĩ Quản lý Giáo dục",
  achievements: "Nhà giáo Ưu tú (2015), Huân chương Lao động hạng Ba (2020)",
  intro: "Thầy Nguyễn Văn A là một nhà giáo mẫu mực, có nhiều đóng góp to lớn cho sự nghiệp giáo dục của tỉnh nhà. Trong suốt 25 năm công tác, thầy luôn tận tâm với nghề, đổi mới phương pháp giảng dạy và quản lý, đào tạo nhiều thế hệ học sinh giỏi quốc gia và quốc tế.",
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256"
};

export const getCandidateData = () => {
  const localData = localStorage.getItem('candidate_data');
  if (localData) {
    return { ...mockCandidate, ...JSON.parse(localData) };
  }
  return mockCandidate;
};

export const mockAchievementsFiles = [
  { id: 1, category: "Thành tích giảng dạy", fileName: "BaoCaoThanhTich.pdf", fileUrl: "#", fileType: "application/pdf", size: 2500000 },
  { id: 2, category: "Sáng kiến kinh nghiệm", fileName: "SangKien2023.docx", fileUrl: "#", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1200000 },
  { id: 3, category: "Bằng khen", fileName: "BangKhenBoGD.jpg", fileUrl: "#", fileType: "image/jpeg", size: 800000 },
];

export const getAchievementsFiles = () => {
  const localData = localStorage.getItem('achievements_files');
  if (localData) {
    return JSON.parse(localData);
  }
  return mockAchievementsFiles;
};

export const mockSurveyResponses = [
  { id: 1, name: "Trần Thị B", position: "Giáo viên", unit: "Tổ Toán", q1: "Biết rõ", q2: ["Tâm huyết với nghề", "Thành tích giảng dạy xuất sắc"], q3: "Rất xứng đáng", q4: "Thầy A rất xứng đáng.", createdAt: "2023-10-25T10:00:00Z" },
  { id: 2, name: "Lê Văn C", position: "Tổ trưởng", unit: "Tổ Lý", q1: "Biết nhưng chưa đầy đủ", q2: ["Có sáng kiến đổi mới giáo dục"], q3: "Xứng đáng", q4: "", createdAt: "2023-10-26T14:30:00Z" },
];
