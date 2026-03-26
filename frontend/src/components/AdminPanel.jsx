import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../api';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingFile, setDeletingFile] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const { data } = await API.get('/documents');
      setDocuments(data.documents || []);
    } catch (err) {
      toast.error("Failed to fetch documents: " + err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDocuments();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast.success("Authentication successful!");
    } else {
      toast.error("Incorrect password.");
      setPassword('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await API.post("/upload", formData);
      toast.success(`Extracted ${data.chunks_stored} vectorized chunks for ${data.filename}.`);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message);
    }
    setUploading(false);
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to permanently delete ${filename}?`)) return;
    
    setDeletingFile(filename);
    try {
      const { data } = await API.delete(`/document/${filename}`);
      toast.success(data.message || `Deleted ${filename}`);
      fetchDocuments();
    } catch (err) {
      toast.error("Error deleting file: " + (err.response?.data?.detail || err.message));
    }
    setDeletingFile(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto w-full h-full flex items-center justify-center relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl max-w-md w-full relative z-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-4 bg-slate-800/80 rounded-full border border-slate-700/50 mb-2">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <p className="text-slate-400 text-sm">Please enter the master password to manage documents.</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/25"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full custom-scrollbar relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="p-6 md:p-12 w-full max-w-5xl mx-auto flex flex-col gap-10 relative z-10">
        
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-inner">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Center</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Train the AI by managing your restaurant menus and policy guides.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3 flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Active Documents
            </h3>
            
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-2 shadow-xl min-h-[300px]">
              {loadingDocs ? (
                <div className="h-full min-h-[250px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-500 gap-4">
                  <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  <p>No documents found. Upload one to begin.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 p-2 relative">
                  {documents.map((doc, idx) => (
                    <li key={idx} className="group bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between transition-all duration-300">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${doc.endsWith('.pdf') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2.5L17.5 9H13V4.5zM6 20V4h5v7h7v9H6z"/></svg>
                        </div>
                        <span className="text-slate-200 font-medium truncate text-sm sm:text-base">{doc}</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(doc)}
                        disabled={deletingFile === doc}
                        className="p-2.5 rounded-xl bg-slate-900/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-slate-700/50 hover:border-red-500/30 disabled:opacity-50"
                        title="Delete Document"
                      >
                        {deletingFile === doc ? (
                           <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Upload New
            </h3>
            
            <div className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md border ${file ? 'border-amber-500/50' : 'border-slate-700/50'} rounded-3xl p-6 shadow-xl transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between min-h-[300px]`}>
              <div className="flex-1 flex flex-col justify-center">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600/60 rounded-2xl cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all w-full h-full group">
                  <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${file ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:scale-110'}`}>
                    {file ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-300 font-medium text-center px-2">
                    {file ? <span className="text-amber-400 font-bold">{file.name}</span> : "Click to browse or drag and drop"}
                  </span>
                  <span className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-wider">PDF or DOCX</span>
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} />
                </label>
              </div>

              <div className="w-full mt-6">
                <button 
                  onClick={handleUpload} 
                  disabled={!file || uploading}
                  className="w-full py-4 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-2xl disabled:opacity-20 disabled:grayscale transition-all shadow-lg hover:shadow-amber-500/25 flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : "Initialize Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
