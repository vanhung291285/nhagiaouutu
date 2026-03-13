import { useState, useEffect, FormEvent } from 'react';
import { getCandidateData, getAchievementsFiles } from '../store/mockData';
import { Download, Search, Trash2, Edit, Upload, FileSpreadsheet, FileText, Settings, BarChart3, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import PublicResults from './PublicResults';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'candidate' | 'survey' | 'charts'>('survey');
  const [responses, setResponses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [candidate, setCandidate] = useState(getCandidateData());
  const [achievementsFiles, setAchievementsFiles] = useState(getAchievementsFiles());
  const [loading, setLoading] = useState(true);
  const [newFile, setNewFile] = useState({ category: 'Thành tích giảng dạy', fileName: '', size: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      if (isSupabaseConfigured()) {
        try {
          // Fetch Responses
          const { data: respData, error: respError } = await supabase
            .from('survey_responses')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (respError) throw respError;
          if (respData) {
            setResponses(respData.map(item => ({ ...item, createdAt: item.created_at })));
          }

          // Fetch Candidate
          const { data: candData, error: candError } = await supabase
            .from('candidate_data')
            .select('*')
            .single();
            
          if (!candError && candData) {
            setCandidate(candData);
          } else {
            setCandidate(getCandidateData());
          }

          // Fetch Achievements
          const { data: achData, error: achError } = await supabase
            .from('achievements_files')
            .select('*')
            .order('created_at', { ascending: true });
            
          if (!achError && achData) {
            setAchievementsFiles(achData);
          } else {
            setAchievementsFiles(getAchievementsFiles());
          }
        } catch (error) {
          console.error('Error fetching data from Supabase:', error);
          // Fallback to local storage
          setCandidate(getCandidateData());
          setAchievementsFiles(getAchievementsFiles());
        }
      } else {
        const localResp = localStorage.getItem('survey_responses');
        if (localResp) setResponses(JSON.parse(localResp));
        setCandidate(getCandidateData());
        setAchievementsFiles(getAchievementsFiles());
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Mật khẩu không đúng!');
    }
  };

  const handleSaveCandidate = async () => {
    if (isSupabaseConfigured()) {
      try {
        // Save Candidate (Upsert)
        const { error: candError } = await supabase
          .from('candidate_data')
          .upsert({ id: 1, ...candidate, updated_at: new Date().toISOString() });
        
        if (candError) throw candError;

        // Save Achievements (Delete all and re-insert for simplicity in this mock, or handle properly)
        // In a real app, you'd track changes. Here we'll just sync.
        const { error: delError } = await supabase
          .from('achievements_files')
          .delete()
          .not('id', 'is', null); // Delete all
        
        if (delError) throw delError;

        if (achievementsFiles.length > 0) {
          const { error: insError } = await supabase
            .from('achievements_files')
            .insert(achievementsFiles.map(({ id, ...rest }) => rest)); // Let Supabase generate IDs or keep them
          
          if (insError) throw insError;
        }

        alert('Đã lưu thông tin và hồ sơ thành tích lên Supabase thành công!');
      } catch (error) {
        console.error('Error saving to Supabase:', error);
        alert('Có lỗi xảy ra khi lưu lên Supabase. Dữ liệu đã được lưu tạm vào trình duyệt.');
        localStorage.setItem('candidate_data', JSON.stringify(candidate));
        localStorage.setItem('achievements_files', JSON.stringify(achievementsFiles));
      }
    } else {
      localStorage.setItem('candidate_data', JSON.stringify(candidate));
      localStorage.setItem('achievements_files', JSON.stringify(achievementsFiles));
      alert('Đã lưu thông tin và hồ sơ thành tích vào bộ nhớ trình duyệt!');
    }
  };

  const handleAddFile = () => {
    if (!newFile.fileName) {
      alert('Vui lòng nhập tên file!');
      return;
    }
    const file = {
      id: Date.now(),
      ...newFile,
      fileUrl: '#',
      fileType: newFile.fileName.endsWith('.pdf') ? 'application/pdf' : 
                newFile.fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                'image/jpeg',
      size: Math.floor(Math.random() * 5000000) + 500000 // Mock size
    };
    setAchievementsFiles([...achievementsFiles, file]);
    setNewFile({ category: 'Thành tích giảng dạy', fileName: '', size: 0 });
  };

  const handleDeleteFile = (id: number) => {
    setAchievementsFiles(achievementsFiles.filter(f => f.id !== id));
  };

  const handleCandidateChange = (field: string, value: string | number) => {
    setCandidate(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      alert('Vui lòng cấu hình Supabase để sử dụng tính năng tải ảnh lên.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (jpg, png, webp...).');
      return;
    }

    // Validate size (max 2MB for avatar)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn (tối đa 2MB).');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setCandidate(prev => ({ ...prev, avatarUrl: publicUrl }));
      alert('Tải ảnh đại diện lên thành công!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(`Lỗi khi tải ảnh lên: ${error.message || 'Vui lòng kiểm tra lại bucket "avatars" trong Supabase Storage.'}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dữ liệu này?')) {
      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase
            .from('survey_responses')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          setResponses(responses.filter(r => r.id !== id));
        } catch (error) {
          console.error('Error deleting response:', error);
          alert('Có lỗi xảy ra khi xóa dữ liệu.');
        }
      } else {
        const updated = responses.filter(r => r.id !== id);
        setResponses(updated);
        const localData = JSON.parse(localStorage.getItem('survey_responses') || '[]');
        const updatedLocal = localData.filter((r: any) => r.id !== id);
        localStorage.setItem('survey_responses', JSON.stringify(updatedLocal));
      }
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(responses.map(r => ({
      'Họ và tên': r.name,
      'Chức vụ': r.position,
      'Đơn vị': r.unit,
      'Biết về danh hiệu': r.q1,
      'Tiêu chí quan trọng': r.q2 ? r.q2.join(', ') : '',
      'Mức độ xứng đáng': r.q3,
      'Ý kiến thêm': r.q4 || '',
      'Thời gian': format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm')
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhaoSat");
    XLSX.writeFile(workbook, "KetQuaKhaoSat.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.text("BAO CAO KET QUA KHAO SAT", 105, 15, { align: "center" });
    
    const tableColumn = ["Ho ten", "Chuc vu", "Don vi", "Muc do xung dang", "Thoi gian"];
    const tableRows = responses.map(r => [
      r.name,
      r.position,
      r.unit,
      r.q3,
      format(new Date(r.createdAt), 'dd/MM/yyyy')
    ]);

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    doc.save("BaoCaoKhaoSat.pdf");
  };

  const filteredResponses = responses.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập Quản trị</h2>
          <p className="text-slate-500 mt-2">Vui lòng nhập mật khẩu để tiếp tục</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="password" 
              placeholder="Mật khẩu (admin123)" 
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển Quản trị</h1>
        <div className="flex bg-slate-200 p-1 rounded-lg overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('survey')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'survey' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Quản lý Khảo sát
          </button>
          <button 
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'charts' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BarChart3 className="h-4 w-4" /> Biểu đồ kết quả
          </button>
          <button 
            onClick={() => setActiveTab('candidate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'candidate' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Hồ sơ Nhà giáo
          </button>
        </div>
      </div>

      {activeTab === 'charts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <PublicResults />
        </div>
      )}

      {activeTab === 'survey' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm tên, đơn vị..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={exportToExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors border border-emerald-200">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </button>
              <button onClick={exportToPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-200">
                <FileText className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Đơn vị</th>
                  <th className="px-6 py-4">Đánh giá</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredResponses.length > 0 ? (
                  filteredResponses.map(response => (
                    <tr key={response.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {response.name}
                        <div className="text-xs text-slate-500 font-normal">{response.position}</div>
                      </td>
                      <td className="px-6 py-4">{response.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          response.q3 === 'Rất xứng đáng' ? 'bg-emerald-100 text-emerald-800' :
                          response.q3 === 'Xứng đáng' ? 'bg-blue-100 text-blue-800' :
                          response.q3 === 'Cần xem xét thêm' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {response.q3}
                        </span>
                      </td>
                      <td className="px-6 py-4">{format(new Date(response.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(response.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'candidate' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Thông tin Nhà giáo</h2>
            <button onClick={handleSaveCandidate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              <Edit className="h-4 w-4" /> Lưu thay đổi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
                <div className="relative group w-32 h-32 mx-auto mb-4">
                  <img src={candidate.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm" referrerPolicy="no-referrer" />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-medium text-slate-700 text-left">Tải ảnh từ máy tính</label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                    <label 
                      htmlFor="avatar-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium cursor-pointer transition-colors ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="h-3 w-3" /> {isUploadingAvatar ? 'Đang tải...' : 'Chọn ảnh từ máy'}
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Hoặc dán URL</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={candidate.avatarUrl} 
                      onChange={e => handleCandidateChange('avatarUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 italic">Lưu ý: Để tải ảnh lên, bạn cần tạo bucket tên "avatars" trong Supabase Storage.</p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <h3 className="font-medium text-slate-800 mb-3">Tải lên hồ sơ thành tích</h3>
                <button className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                  <Upload className="h-4 w-4" /> Chọn file (Max 10MB)
                </button>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề phụ (Dưới tên ứng viên)</label>
                  <input type="text" value={candidate.subtitle} onChange={e => handleCandidateChange('subtitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                  <input type="text" value={candidate.name} onChange={e => handleCandidateChange('name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                  <input type="date" value={candidate.dob} onChange={e => handleCandidateChange('dob', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
                  <input type="text" value={candidate.position} onChange={e => handleCandidateChange('position', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị công tác</label>
                  <input type="text" value={candidate.unit} onChange={e => handleCandidateChange('unit', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số năm công tác</label>
                  <input type="number" value={candidate.yearsOfWork} onChange={e => handleCandidateChange('yearsOfWork', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trình độ chuyên môn</label>
                  <input type="text" value={candidate.qualifications} onChange={e => handleCandidateChange('qualifications', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh hiệu đã đạt</label>
                <input type="text" value={candidate.achievements} onChange={e => handleCandidateChange('achievements', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu chung</label>
                <textarea rows={5} value={candidate.intro} onChange={e => handleCandidateChange('intro', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>

              {/* Achievements Files Management */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quản lý Hồ sơ thành tích</h3>
                
                <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700">Thêm hồ sơ mới</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Danh mục</label>
                      <select 
                        value={newFile.category} 
                        onChange={e => setNewFile({...newFile, category: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option>Thành tích giảng dạy</option>
                        <option>Sáng kiến kinh nghiệm</option>
                        <option>Danh hiệu thi đua</option>
                        <option>Bằng khen</option>
                        <option>Hoạt động đóng góp cho cộng đồng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tên file (kèm đuôi .pdf, .docx, .jpg)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="VD: BaoCao2023.pdf"
                          value={newFile.fileName}
                          onChange={e => setNewFile({...newFile, fileName: e.target.value})}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button 
                          onClick={handleAddFile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {achievementsFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{file.fileName}</p>
                          <p className="text-xs text-slate-500">{file.category}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
