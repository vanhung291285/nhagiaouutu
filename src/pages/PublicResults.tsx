import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Users, CheckCircle } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function PublicResults() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('survey_responses')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          if (data) {
            // Map created_at to createdAt to match existing code
            const mappedData = data.map(item => ({
              ...item,
              createdAt: item.created_at
            }));
            setResponses(mappedData);
          }
        } catch (error) {
          console.error('Error fetching responses:', error);
        }
      } else {
        // Fallback to local storage if Supabase is not configured
        const localData = localStorage.getItem('survey_responses');
        if (localData) {
          setResponses(JSON.parse(localData));
        }
      }
      setLoading(false);
    };

    fetchResponses();
  }, []);

  // Calculate stats
  const totalResponses = responses.length;
  
  const q3Stats = responses.reduce((acc, curr) => {
    acc[curr.q3] = (acc[curr.q3] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const q2Stats = responses.reduce((acc, curr) => {
    if (curr.q2 && Array.isArray(curr.q2)) {
      curr.q2.forEach((item: string) => {
        acc[item] = (acc[item] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = {
    labels: ['Rất xứng đáng', 'Xứng đáng', 'Cần xem xét thêm', 'Không có ý kiến'],
    datasets: [
      {
        data: [
          q3Stats['Rất xứng đáng'] || 0,
          q3Stats['Xứng đáng'] || 0,
          q3Stats['Cần xem xét thêm'] || 0,
          q3Stats['Không có ý kiến'] || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // emerald-500
          'rgba(59, 130, 246, 0.8)', // blue-500
          'rgba(245, 158, 11, 0.8)', // amber-500
          'rgba(148, 163, 184, 0.8)', // slate-400
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(148, 163, 184)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: Object.keys(q2Stats),
    datasets: [
      {
        label: 'Số lượt chọn',
        data: Object.values(q2Stats),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 sm:p-10">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Biểu Đồ Kết Quả Khảo Sát</h1>
        <p className="text-slate-500">Tổng hợp ý kiến đánh giá từ người tham gia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Tổng số lượt tham gia</p>
              <p className="text-3xl font-bold text-blue-900">{totalResponses}</p>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-lg text-white">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Tỷ lệ đánh giá xứng đáng</p>
              <p className="text-3xl font-bold text-emerald-900">
                {totalResponses > 0 
                  ? Math.round(((q3Stats['Rất xứng đáng'] || 0) + (q3Stats['Xứng đáng'] || 0)) / totalResponses * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Pie Chart */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">Đánh giá mức độ xứng đáng</h3>
            <div className="h-64 flex justify-center">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">Tiêu chí quan trọng nhất</h3>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Ý kiến nhận xét thêm</h3>
          <div className="space-y-4">
            {responses.filter(r => r.q4 && r.q4.trim() !== '').length > 0 ? (
              responses.filter(r => r.q4 && r.q4.trim() !== '').map((response, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-slate-700 italic">"{response.q4}"</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">Chưa có ý kiến nhận xét thêm.</p>
            )}
          </div>
        </div>
    </div>
  );
}
