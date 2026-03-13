import { useState, useEffect } from 'react';
import { getCandidateData } from '../store/mockData';
import { Calendar, Briefcase, MapPin, Clock, GraduationCap, Award } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Home() {
  const [candidate, setCandidate] = useState(getCandidateData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('candidate_data')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
          
          if (!error && data) {
            setCandidate(data);
          }
        } catch (error) {
          console.error('Error fetching candidate from Supabase:', error);
        }
      }
      setLoading(false);
    };

    fetchCandidate();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="px-4 sm:px-10 pb-10">
          {/* Avatar & Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8 relative">
            <div className="-mt-16 sm:-mt-24 shrink-0 z-10">
              <img 
                src={candidate.avatarUrl} 
                alt={candidate.name} 
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-[4px] sm:border-[6px] border-white shadow-lg object-cover bg-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center sm:text-left pb-2 sm:pb-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">{candidate.name}</h1>
              <p className="text-base sm:text-xl text-blue-600 font-medium mt-1">{candidate.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column: Basic Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Thông tin cơ bản</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Ngày sinh</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{new Date(candidate.dob).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Chức vụ</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{candidate.position}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Đơn vị công tác</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{candidate.unit}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Số năm công tác</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{candidate.yearsOfWork} năm</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Trình độ chuyên môn</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{candidate.qualifications}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Danh hiệu đã đạt</p>
                      <p className="text-sm sm:text-base font-medium text-slate-700">{candidate.achievements}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Intro */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Giới thiệu chung</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
                    {candidate.intro}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
