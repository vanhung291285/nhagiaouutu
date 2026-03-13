import { useState, useEffect, FormEvent } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Survey() {
  const [submitted, setSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    unit: '',
    q1: '',
    q2: [] as string[],
    q3: '',
    q4: ''
  });

  useEffect(() => {
    // Check if user has already voted
    const voted = localStorage.getItem('has_voted_survey');
    if (voted) {
      setHasVoted(true);
    }
  }, []);

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => {
      const q2 = prev.q2.includes(value)
        ? prev.q2.filter(item => item !== value)
        : [...prev.q2, value];
      return { ...prev, q2 };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.q2.length === 0) {
      alert('Vui lòng chọn ít nhất một tiêu chí ở Câu 2.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('survey_responses')
          .insert([
            {
              name: formData.name,
              position: formData.position,
              unit: formData.unit,
              q1: formData.q1,
              q2: formData.q2,
              q3: formData.q3,
              q4: formData.q4
            }
          ]);
          
        if (error) throw error;
      } else {
        throw new Error('Supabase chưa được cấu hình. Dữ liệu khảo sát không thể lưu công khai.');
      }
      
      setSubmitted(true);
      localStorage.setItem('has_voted_survey', 'true');
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      alert(`Lỗi gửi khảo sát: ${error.message || 'Vui lòng kiểm tra kết nối mạng.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted && !submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center animate-in fade-in">
        <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bạn đã tham gia khảo sát</h2>
        <p className="text-slate-600">
          Hệ thống ghi nhận bạn đã gửi ý kiến. Mỗi người chỉ được tham gia khảo sát một lần để đảm bảo tính khách quan.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center animate-in zoom-in duration-300">
        <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Cảm ơn thầy/cô!</h2>
        <p className="text-lg text-slate-600">
          Cảm ơn thầy/cô đã tham gia đóng góp ý kiến. Ý kiến của thầy/cô rất quan trọng trong quá trình xét tặng danh hiệu.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-700 p-8 text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">THĂM DÒ Ý KIẾN</h1>
          <p className="text-blue-100 text-lg">XÉT TẶNG DANH HIỆU NHÀ GIÁO ƯU TÚ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
          {/* Personal Info */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Thông tin người tham gia</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị công tác <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Questions */}
          <section className="space-y-8">
            <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Câu hỏi khảo sát</h2>
            
            {/* Q1 */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-slate-900">
                Câu 1: Thầy/cô có biết về danh hiệu "Nhà giáo Ưu Tú" không? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {['Biết rõ', 'Biết nhưng chưa đầy đủ', 'Chưa biết rõ'].map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="q1" 
                      value={option}
                      required
                      checked={formData.q1 === option}
                      onChange={e => setFormData({...formData, q1: e.target.value})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-slate-900">
                Câu 2: Theo thầy/cô, tiêu chí quan trọng nhất của Nhà giáo Ưu Tú là gì? (Có thể chọn nhiều) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  'Tâm huyết với nghề',
                  'Thành tích giảng dạy xuất sắc',
                  'Có sáng kiến đổi mới giáo dục',
                  'Đào tạo nhiều học sinh giỏi',
                  'Được đồng nghiệp và học sinh kính trọng',
                  'Có đóng góp cho cộng đồng'
                ].map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      value={option}
                      checked={formData.q2.includes(option)}
                      onChange={() => handleCheckboxChange(option)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q3 */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-slate-900">
                Câu 3: Thầy/cô đánh giá mức độ xứng đáng của nhà giáo được đề nghị xét tặng: <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {['Rất xứng đáng', 'Xứng đáng', 'Cần xem xét thêm', 'Không có ý kiến'].map(option => (
                  <label key={option} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="q3" 
                      value={option}
                      required
                      checked={formData.q3 === option}
                      onChange={e => setFormData({...formData, q3: e.target.value})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q4 */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-slate-900">
                Câu 4: Ý kiến nhận xét thêm
              </label>
              <textarea 
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                placeholder="Nhập ý kiến của thầy/cô tại đây..."
                value={formData.q4}
                onChange={e => setFormData({...formData, q4: e.target.value})}
              ></textarea>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-200">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang gửi...
                </>
              ) : (
                'Gửi ý kiến khảo sát'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
