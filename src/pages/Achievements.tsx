import { useState, useEffect } from 'react';
import { getAchievementsFiles } from '../store/mockData';
import { FileText, Download, Eye, File, Image as ImageIcon, Award } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Achievements() {
  const [files, setFiles] = useState(getAchievementsFiles());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('achievements_files')
            .select('*')
            .order('created_at', { ascending: true });
          
          if (!error && data) {
            setFiles(data);
          }
        } catch (error) {
          console.error('Error fetching achievements from Supabase:', error);
        }
      }
      setLoading(false);
    };

    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = [
    "Thành tích giảng dạy",
    "Sáng kiến kinh nghiệm",
    "Danh hiệu thi đua",
    "Bằng khen",
    "Hoạt động đóng góp cho cộng đồng"
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('image')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.includes('word')) return <FileText className="h-8 w-8 text-blue-700" />;
    return <File className="h-8 w-8 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Hồ sơ thành tích</h1>
        <p className="text-slate-500 mb-8">Danh sách các tài liệu, minh chứng về thành tích của nhà giáo.</p>

        <div className="space-y-10">
          {categories.map(category => {
            const categoryFiles = files.filter(f => f.category === category);
            
            return (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-100 pb-2 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {category}
                </h2>
                
                {categoryFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryFiles.map(file => (
                      <div key={file.id} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-slate-50 group">
                        <div className="mr-4 bg-white p-2 rounded-lg shadow-sm">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate" title={file.fileName}>
                            {file.fileName}
                          </p>
                          <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                        </div>
                        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Xem trước">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Tải về">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic py-4">Chưa có tài liệu minh chứng cho mục này.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
