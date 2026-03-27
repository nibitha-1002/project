import React, { useEffect, useState } from 'react';
import api from '../api';
import { PlusCircle, CalendarDays, Users, LogOut, CheckCircle, ListTodo, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function QuestionModal({ exam, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState({ text: '', options: '', correct_answer: '', marks: 1 });

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    const res = await api.get(`/questions/?exam=${exam.id}`);
    setQuestions(res.data);
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    const payload = {
      ...newQ,
      exam: exam.id,
      options: newQ.options.split(',').map(s => s.trim())
    };
    await api.post('/questions/', payload);
    setNewQ({ text: '', options: '', correct_answer: '', marks: 1 });
    fetchQuestions();
  };

  const deleteQuestion = async (id) => {
    await api.delete(`/questions/${id}/`);
    fetchQuestions();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Questions for: {exam.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={addQuestion} className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-4 border border-slate-200">
          <h4 className="font-bold text-slate-800 flex items-center"><PlusCircle className="mr-2 w-4 h-4"/> Add New Question</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Question Text" required value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} className="md:col-span-2 p-3 rounded-xl border border-slate-300"/>
            <input placeholder="Options (comma separated)" required value={newQ.options} onChange={e => setNewQ({...newQ, options: e.target.value})} className="p-3 rounded-xl border border-slate-300"/>
            <input placeholder="Correct Answer" required value={newQ.correct_answer} onChange={e => setNewQ({...newQ, correct_answer: e.target.value})} className="p-3 rounded-xl border border-slate-300"/>
            <input type="number" placeholder="Marks" required value={newQ.marks} onChange={e => setNewQ({...newQ, marks: parseInt(e.target.value)})} className="p-3 rounded-xl border border-slate-300"/>
            <button type="submit" className="md:col-span-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Add to Paper</button>
          </div>
        </form>

        <div className="space-y-4">
          <h4 className="font-bold text-slate-800">Current Question Paper</h4>
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-start hover:border-indigo-300 transition-colors">
              <div>
                <p className="font-bold text-slate-900">{i+1}. {q.text}</p>
                <p className="text-sm text-slate-500">Options: {q.options.join(', ')}</p>
                <p className="text-sm font-semibold text-green-600">Answer: {q.correct_answer} ({q.marks} Marks)</p>
              </div>
              <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
            </div>
          ))}
          {questions.length === 0 && <p className="text-center text-slate-400 py-4">No questions added yet.</p>}
        </div>
      </div>
    </div>
  );
}

function ResultsModal({ exam, onClose }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults();
  }, [exam.id]);

  const fetchResults = async () => {
    const res = await api.get(`/exams/${exam.id}/admin_results/`);
    setResults(res.data);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Exam Results: {exam.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Student</th>
                <th className="px-6 py-4 font-bold">Score</th>
                <th className="px-6 py-4 font-bold">Submitted At</th>
                <th className="px-6 py-4 font-bold">Blockchain Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 font-medium text-slate-700">
                  <td className="px-6 py-4 text-indigo-600 font-bold">{r.user_username}</td>
                  <td className="px-6 py-4">{r.score}</td>
                  <td className="px-6 py-4">{new Date(r.submitted_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 p-1 rounded block truncate w-32" title={r.blockchain_tx_hash}>
                      {r.blockchain_tx_hash || 'Pending...'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && <p className="text-center text-slate-500 mt-8 font-semibold">No submissions yet.</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedExamForQs, setSelectedExamForQs] = useState(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);
  const [newExam, setNewExam] = useState({ title: '', start_time: '', end_time: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const res = await api.get('/exams/');
    setExams(res.data);
  };

  const createExam = async (e) => {
    e.preventDefault();
    console.log("Submitting new exam:", newExam);
    await api.post('/exams/', newExam);
    setShowModal(false);
    fetchExams();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 shadow-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <CheckCircle className="mr-3 text-indigo-400" /> Admin Control Center
          </h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-indigo-300 hover:text-white transition-colors">
            <LogOut size={20} /> <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-slate-200">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-xl p-3">
                <CalendarDays className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Exams</dt>
                  <dd className="text-3xl font-bold text-slate-900">{exams.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
               onClick={() => setShowModal(true)}>
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-xl p-3">
                <PlusCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Action</dt>
                  <dd className="text-xl font-bold text-slate-900">Create New Exam</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center"><CalendarDays className="mr-2"/> Planned Exams</h2>
        <div className="bg-white shadow rounded-2xl overflow-hidden border border-slate-200">
          <ul className="divide-y divide-slate-200">
            {exams.map((exam) => (
              <li key={exam.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Start: {new Date(exam.start_time).toLocaleString()}</p>
                    <p className="text-sm text-slate-500 font-medium">End: {new Date(exam.end_time).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setSelectedExamForQs(exam)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                      <ListTodo size={16} className="mr-2"/> Manage Qs
                    </button>
                    <button onClick={() => setSelectedExamForResults(exam)} className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors">
                      <Eye size={16} className="mr-2"/> Results
                    </button>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      LIVE
                    </span>
                  </div>
                </div>
              </li>
            ))}
            {exams.length === 0 && <li className="p-6 text-center text-slate-500">No exams created yet.</li>}
          </ul>
        </div>
      </main>

      {selectedExamForQs && <QuestionModal exam={selectedExamForQs} onClose={() => setSelectedExamForQs(null)} />}
      {selectedExamForResults && <ResultsModal exam={selectedExamForResults} onClose={() => setSelectedExamForResults(null)} />}

      {showModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto pl-4">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-60 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-8 pt-8 pb-6">
                <h3 className="text-2xl leading-6 font-bold text-slate-900 mb-6" id="modal-title">Create a New Exam</h3>
                <form onSubmit={createExam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Exam Title</label>
                    <input type="text" required onChange={e => setNewExam({...newExam, title: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Start Time</label>
                    <input type="datetime-local" required onChange={e => setNewExam({...newExam, start_time: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">End Time</label>
                    <input type="datetime-local" required onChange={e => setNewExam({...newExam, end_time: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="py-2 px-4 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit"
                      className="py-2 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors">
                      Save Exam
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
