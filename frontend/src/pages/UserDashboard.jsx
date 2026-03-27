import React, { useEffect, useState } from 'react';
import api from '../api';
import { Play, ClipboardList, Clock, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, []);

  const fetchExams = async () => {
    const res = await api.get('/exams/');
    setExams(res.data);
  };

  const fetchResults = async () => {
    const res = await api.get('/exams/my_results/');
    setResults(res.data);
  };

  const registerExam = async (id) => {
    try {
      await api.post(`/exams/${id}/register/`);
      alert('Registered Successfully!');
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.error || 'Error registering');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <ClipboardList className="mr-3 text-indigo-600 w-8 h-8"/> Dashboard
          </h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={20} /> <span className="font-semibold">Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md">
            <h3 className="text-xl font-bold flex items-center text-slate-800"><Clock className="mr-2 text-indigo-500"/> Available Exams</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {exams.map((exam) => {
              const now = new Date();
              const start = new Date(exam.start_time);
              const end = new Date(exam.end_time);
              const isOngoing = now >= start && now <= end;
              const isUpcoming = now < start;
              
              return (
                <li key={exam.id} className="p-6 hover:bg-slate-50 transition duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{exam.title}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1">Start: {start.toLocaleString()}</p>
                      <p className="text-sm font-medium text-slate-500">End: {end.toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-4 items-center">
                      <button onClick={() => registerExam(exam.id)}
                        className="inline-flex items-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                        Register
                      </button>
                      <button onClick={() => navigate(`/exam/${exam.id}`)} disabled={isUpcoming}
                        className={`inline-flex items-center px-6 py-2 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white transition-all transform active:scale-95 ${
                          isUpcoming ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        }`}>
                        <Play size={16} className="mr-2" /> {isOngoing ? 'Start Exam' : (isUpcoming ? 'Not Started' : 'Ended')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            {exams.length === 0 && <li className="p-6 text-center text-slate-500 font-medium">No exams available. check back later!</li>}
          </ul>
        </div>

        <div className="mt-12 bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-emerald-50/50 backdrop-blur-md">
            <h3 className="text-xl font-bold flex items-center text-emerald-800"><CheckCircle className="mr-2 text-emerald-500"/> My Exam History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Exam</th>
                  <th className="px-6 py-4 font-bold text-center">Score</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.exam_title}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                        {r.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(r.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="flex items-center text-xs text-emerald-600 font-bold mb-1">
                          <ShieldCheck size={14} className="mr-1"/> Blockchain Secured
                        </span>
                        <code className="text-[10px] text-slate-400 block max-w-[100px] truncate" title={r.blockchain_tx_hash}>
                          {r.blockchain_tx_hash}
                        </code>
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium italic">
                      No exam attempts found yet. Take your first exam to see results!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
