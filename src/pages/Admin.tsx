import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import { getCandidateData, getAchievementsFiles } from '../store/mockData';
import { Download, Search, Trash2, Edit, Upload, FileSpreadsheet, FileText, Settings, BarChart3, Plus, X, AlertCircle, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import PublicResults from './PublicResults';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState<'candidate' | 'survey' | 'charts'>('survey');

  const [responses, setResponses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [achievementsFiles, setAchievementsFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFileCategory, setNewFileCategory] = useState('Thành tích giảng dạy');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
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

        // Fetch Candidate - Specifically ID 1
        const { data: candData, error: candError } = await supabase
          .from('candidate_data')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
          
        if (!candError && candData) {
          setCandidate(candData);
        } else if (!candError && !candData) {
          // Only use mock data if Supabase is confirmed empty AND we don't have data yet
          setCandidate(prev => prev || getCandidateData());
        }

        // Fetch Achievements
        const { data: achData, error: achError } = await supabase
          .from('achievements_files')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (!achError && achData) {
          setAchievementsFiles(achData);
        } else if (!achError && !achData) {
          setAchievementsFiles(prev => prev.length > 0 ? prev : getAchievementsFiles());
        }
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        setCandidate(prev => prev || getCandidateData());
      }
    } else {
      const localResp = localStorage.getItem('survey_responses');
      if (localResp) setResponses(JSON.parse(localResp));
      setCandidate(getCandidateData());
      setAchievementsFiles(getAchievementsFiles());
    }
    
    if (!isSilent) setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignUp = async () => {
    if (!username || !password) {
      alert('Vui lòng nhập Email và Mật khẩu muốn tạo!');
      return;
    }

    setIsInitializing(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: username,
        password: password,
      });

      if (error) throw error;
      
      alert('Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng nhập.');
    } catch (err: any) {
      alert(`Lỗi đăng ký: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Re-fetch data when logged in to ensure we have the latest from Supabase
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (error) {
          console.error('Supabase login error:', error);
          alert(`Lỗi đăng nhập: ${error.message}`);
        } else {
          setIsLoggedIn(true);
        }
      } catch (err: any) {
        console.error('Unexpected login error:', err);
        alert(`Lỗi hệ thống: ${err.message || 'Không thể kết nối tới máy chủ'}`);
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      // Fallback nếu chưa cấu hình Supabase
      if (username === 'admin' && password === 'admin123') {
        setIsLoggedIn(true);
      } else {
        alert('Sai thông tin đăng nhập (Chế độ Offline)!');
      }
      setIsLoggingIn(false);
    }
  };

  const handleSaveCandidate = async () => {
    if (isSupabaseConfigured()) {
      setIsSaving(true);
      try {
        // Chuẩn bị dữ liệu: Loại bỏ id cũ nếu có để tránh xung đột
        const { id: _oldId, ...candidateData } = candidate;
        
        // 1. Lưu thông tin nhà giáo (Upsert với ID cố định là 1)
        const { error: candError } = await supabase
          .from('candidate_data')
          .upsert({ 
            id: 1, 
            ...candidateData, 
            updated_at: new Date().toISOString() 
          });
        
        if (candError) throw candError;

        // 2. Lưu hồ sơ thành tích
        // Xóa hết cũ và chèn lại mới để đồng bộ hoàn toàn
        const { error: delError } = await supabase
          .from('achievements_files')
          .delete()
          .not('id', 'is', null);
        
        if (delError) throw delError;

        if (achievementsFiles.length > 0) {
          // Tạo ID mới cho các file chưa có ID hoặc đảm bảo ID hợp lệ
          const filesToInsert = achievementsFiles
            .map(file => ({
              ...file,
              id: (file.id !== null && file.id !== undefined) ? String(file.id) : String(Date.now() + Math.floor(Math.random() * 1000))
            }))
            .filter(file => file.id !== null && file.id !== undefined);
          
          const { error: insError } = await supabase
            .from('achievements_files')
            .insert(filesToInsert);
          
          if (insError) throw insError;
        }

        alert('CHÚC MỪNG: Dữ liệu đã được lưu vĩnh viễn lên Supabase! Bạn có thể xem từ bất kỳ máy tính nào.');
        // Re-fetch silently to get the latest state (including any generated IDs)
        fetchData(true);
      } catch (error: any) {
        console.error('Supabase Save Error:', error);
        const msg = error.message || JSON.stringify(error);
        alert(`LỖI LƯU TRỮ: ${msg}\n\nLưu ý: Dữ liệu hiện chỉ đang lưu tạm trên máy này. Hãy kiểm tra cấu hình Supabase.`);
        localStorage.setItem('candidate_data', JSON.stringify(candidate));
        localStorage.setItem('achievements_files', JSON.stringify(achievementsFiles));
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('candidate_data', JSON.stringify(candidate));
      localStorage.setItem('achievements_files', JSON.stringify(achievementsFiles));
      alert('Đã lưu thông tin và hồ sơ thành tích vào bộ nhớ trình duyệt!');
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      alert('Cấu hình Supabase chưa hoàn tất. Vui lòng kiểm tra lại tệp .env hoặc thiết lập biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng file quá lớn (tối đa 10MB).');
      return;
    }

    setIsUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `achievement-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to 'achievements' bucket
      const { error: uploadError } = await supabase.storage
        .from('achievements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('bucket not found') || uploadError.message.includes('does not exist')) {
          throw new Error('Bucket "achievements" không tồn tại. Vui lòng vào Supabase Dashboard > Storage và tạo một bucket tên là "achievements" với chế độ Public.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('achievements')
        .getPublicUrl(filePath);

      const newAchievementFile = {
        id: Date.now(),
        category: newFileCategory,
        fileName: file.name,
        fileUrl: publicUrl,
        fileType: file.type || 'application/octet-stream',
        size: file.size
      };

      setAchievementsFiles([...achievementsFiles, newAchievementFile]);
      alert('Tải file lên thành công!');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Lỗi khi tải file lên: ${error.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình Storage trên Supabase.'}`);
    } finally {
      setIsUploadingFile(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteFile = (id: number) => {
    setAchievementsFiles(achievementsFiles.filter(f => f.id !== id));
  };

  const handleCandidateChange = (field: string, value: string | number) => {
    setCandidate(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      alert('Cấu hình Supabase chưa hoàn tất. Vui lòng kiểm tra lại tệp .env hoặc thiết lập biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
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
      const filePath = fileName;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('bucket not found') || uploadError.message.includes('does not exist')) {
          throw new Error('Bucket "avatars" không tồn tại. Vui lòng vào Supabase Dashboard > Storage và tạo một bucket tên là "avatars" với chế độ Public.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setCandidate(prev => ({ ...prev, avatarUrl: publicUrl }));
      alert('Tải ảnh đại diện lên thành công!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(`Lỗi khi tải ảnh lên: ${error.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình Storage trên Supabase.'}`);
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
    (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.unit || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !candidate) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 animate-pulse">Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Quản trị hệ thống</h1>
            <p className="text-slate-500 mt-2">Vui lòng đăng nhập để tiếp tục</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
              />
            </div>
            <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={handleSignUp}
                  disabled={isInitializing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isInitializing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Đăng ký'}
                </button>
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Đăng nhập'}
                </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-4">
              Nếu chưa có tài khoản, hãy nhập Email/Mật khẩu và nhấn <strong>Đăng ký</strong>.
            </p>
          </form>
        </div>
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
                      <td className="px-6 py-4">{response.createdAt ? format(new Date(response.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
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
          {!isSupabaseConfigured() && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-3 text-amber-800">
                <AlertCircle className="h-6 w-6" />
                <h3 className="font-bold text-lg">Cấu hình Supabase chưa hoàn tất</h3>
              </div>
              <p className="text-amber-700 text-sm leading-relaxed">
                Để ứng dụng có thể lưu trữ dữ liệu và ảnh đại diện lên đám mây, bạn cần thiết lập các thông tin kết nối trong menu <strong>Settings</strong> của AI Studio:
              </p>
              <div className="bg-white/50 p-4 rounded-lg border border-amber-100 space-y-2 font-mono text-xs text-amber-900">
                <p>1. Mở menu <strong>Settings</strong> (biểu tượng bánh răng) ở góc trên bên phải.</p>
                <p>2. Thêm 2 biến môi trường mới:</p>
                <p className="pl-4 font-bold">• VITE_SUPABASE_URL</p>
                <p className="pl-4 font-bold">• VITE_SUPABASE_ANON_KEY</p>
                <p>3. Dán giá trị tương ứng từ dự án Supabase của bạn.</p>
              </div>
              <p className="text-amber-600 text-xs italic">
                * Sau khi thêm, hãy làm mới (Refresh) trang web để áp dụng thay đổi.
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Thông tin Nhà giáo</h2>
            <div className="flex gap-2">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Eye className="h-4 w-4" /> Xem hồ sơ
              </Link>
              <button 
                onClick={handleSaveCandidate} 
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : <Edit className="h-4 w-4" />}
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Thông tin nhà giáo (Giới thiệu chung)</label>
                <textarea rows={4} value={candidate.bio || ''} onChange={e => handleCandidateChange('bio', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập thông tin giới thiệu chung về nhà giáo..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">BẢN KHAI THÀNH TÍCH ĐỀ NGHỊ XÉT TẶNG DANH HIỆU NHÀ GIÁO ƯU TÚ</label>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <JoditEditor
                    value={candidate.intro}
                    config={{
                      readonly: false,
                      placeholder: 'Nhập thành tích đạt được, có thể copy/paste bảng từ Word/Excel...',
                      height: 400,
                      uploader: {
                        insertImageAsBase64URI: true
                      },
                      askBeforePasteHTML: false,
                      askBeforePasteFromWord: false,
                      defaultActionOnPaste: 'insert_as_html',
                      processPasteHTML: true,
                      processPasteFromWord: true
                    }}
                    onBlur={newContent => handleCandidateChange('intro', newContent)}
                  />
                </div>
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
                        value={newFileCategory} 
                        onChange={e => setNewFileCategory(e.target.value)}
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
                      <label className="block text-xs text-slate-500 mb-1">Chọn file (PDF, DOCX, JPG - Max 10MB)</label>
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          {isUploadingFile ? 'Đang tải...' : 'Chọn file'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            disabled={isUploadingFile}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">Lưu ý: Để tải file lên, bạn cần tạo bucket tên "achievements" trong Supabase Storage.</p>
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
