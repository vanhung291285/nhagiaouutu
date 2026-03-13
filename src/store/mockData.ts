export const mockCandidate = {
  name: "Lê Thị Thanh Nhã",
  subtitle: "Ứng viên đề nghị xét tặng danh hiệu \"Nhà giáo Ưu Tú\"",
  dob: "1980-01-01",
  position: "Giáo viên",
  unit: "Trường THPT",
  yearsOfWork: 20,
  qualifications: "Thạc sĩ Giáo dục",
  achievements: "Chiến sĩ thi đua cơ sở, Bằng khen của Bộ Giáo dục",
  bio: "Cô Lê Thị Thanh Nhã là một nhà giáo tận tâm, luôn nỗ lực trong công tác giảng dạy và bồi dưỡng học sinh.",
  intro: "<p>Nhập thành tích đạt được tại đây...</p>",
  introTitle: "BẢN KHAI THÀNH TÍCH ĐỀ NGHỊ XÉT TẶNG DANH HIỆU NHÀ GIÁO ƯU TÚ",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256&h=256"
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
