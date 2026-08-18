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

  const [previewFile, setPreviewFile] = useState(null);
  const [previewChunks, setPreviewChunks] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  const handleUpload = async (e) => {
    e?.stopPropagation();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await API.post("/upload", formData);
      toast.success(`Vectorized ${data.chunks_stored} chunks for ${data.filename}.`);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename, e) => {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete ${filename}?`)) return;

    setDeletingFile(filename);
    try {
      const { data } = await API.delete(`/document/${filename}`);
      toast.success(data.message || `Deleted ${filename}`);
      fetchDocuments();
    } catch (err) {
      toast.error("Error deleting file: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingFile(null);
    }
  };

  const handlePreview = async (filename, e) => {
    e?.stopPropagation();
    setPreviewFile(filename);
    setLoadingPreview(true);
    try {
      const { data } = await API.get(`/document/chunks/${filename}`);
      setPreviewChunks(data.chunks || []);
    } catch (err) {
      toast.error("Failed to load chunks: " + err.message);
      setPreviewFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // 1. Password Protection Modal
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-4">
        <div className="glass-panel glass-border rounded-2xl p-8 flex flex-col items-center w-[420px] max-w-[90%] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
          {/* Top glowing edge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-primary/50 blur-sm"></div>

          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[36px]" data-weight="fill">
              lock
            </span>
          </div>

          <h2 className="font-headline-md text-xl md:text-2xl text-on-surface mb-2 text-center">
            Secure Access
          </h2>
          <p className="font-body-md text-on-surface-variant text-center mb-6 text-sm">
            Authentication required to manage AI knowledge bases.
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="relative w-full">
              <input
                className="w-full bg-surface-container border-b-2 border-outline-variant/30 text-on-surface p-3 outline-none focus:border-primary transition-colors font-body-md text-center tracking-widest placeholder:tracking-normal placeholder:text-on-surface-variant/40 rounded-t-md text-base"
                placeholder="Enter Passcode"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-button-text rounded-full py-3.5 px-6 hover:shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer font-semibold"
            >
              Unlock Knowledge Center
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Knowledge Center Dashboard
  return (
    <main className="flex-1 pt-24 pb-12 px-4 md:px-12 w-full max-w-[1200px] mx-auto overflow-y-auto min-h-screen relative z-10">
      {/* Header Section */}
      <div className="mb-8 border-b border-surface-container-high pb-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/20 shadow-inner flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl" data-weight="fill">
            folder_managed
          </span>
        </div>
        <div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-2xl md:text-4xl text-on-surface mb-1 font-semibold">
            Knowledge <span className="text-primary">Center</span>
          </h1>
          <p className="font-body-md text-sm md:text-base text-on-surface-variant">
            Train the AI by managing your restaurant menus and policy guides.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Documents */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h3 className="font-label-caps text-xs text-primary tracking-widest">
              Active Documents
            </h3>
            <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs text-on-surface-variant font-label-caps">
              Total: {documents.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {loadingDocs ? (
              <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span className="font-label-caps text-xs text-on-surface-variant tracking-wider">
                  Loading knowledge base...
                </span>
              </div>
            ) : documents.length === 0 ? (
              <div className="glass-panel glass-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <p className="font-body-md text-sm text-on-surface-variant">
                  No documents found in knowledge base.
                </p>
                <span className="font-label-caps text-[10px] text-primary/70">
                  Upload a PDF or DOCX to train the assistant
                </span>
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="glass-panel glass-border glass-glow-hover rounded-xl p-4 flex items-center justify-between group transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      doc.toLowerCase().endsWith('.pdf')
                        ? 'bg-error/10 text-error border border-error/20'
                        : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {doc.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-body-md text-sm md:text-base text-on-surface font-medium truncate">
                        {doc}
                      </h4>
                      <p className="font-label-caps text-[10px] text-on-surface-variant mt-0.5 tracking-wider">
                        Vectorized • Ready for RAG
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handlePreview(doc, e)}
                      className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors cursor-pointer"
                      title="View Chunks"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc, e)}
                      disabled={deletingFile === doc}
                      className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Document"
                    >
                      {deletingFile === doc ? (
                        <div className="w-4 h-4 border-2 border-error/30 border-t-error rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upload Zone */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h3 className="font-label-caps text-xs text-primary tracking-widest">
              Upload New Source
            </h3>
          </div>

          <div className="glass-panel border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center p-8 min-h-[380px] hover:border-primary hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden">
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <label
              htmlFor="file-upload-input"
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(242,202,80,0.2)] transition-all duration-500 border border-outline-variant/30">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant group-hover:text-primary transition-colors" data-weight="fill">
                  cloud_upload
                </span>
              </div>

              <h3 className="font-headline-md text-base md:text-lg text-on-surface mb-2 group-hover:text-primary transition-colors">
                {file ? file.name : "Select or Drop Document"}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant text-center max-w-[260px] mb-4">
                Upload PDF or DOCX files to expand the chatbot knowledge base.
              </p>

              <span className="border border-outline-variant/50 text-on-surface px-5 py-1.5 rounded-full font-button-text text-xs group-hover:border-primary group-hover:text-primary transition-colors inline-block">
                {file ? "Change Selected File" : "Browse Files"}
              </span>
            </label>

            {/* Initialize Upload Action Button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-button-text text-sm rounded-full py-3 px-6 hover:shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-semibold"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                    Vectorizing Knowledge...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    Initialize Upload & Ingest
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Chunks Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[70] bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel glass-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest/50">
              <div>
                <h2 className="font-headline-md text-lg md:text-xl text-on-surface font-semibold">
                  Document Vectors
                </h2>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  {previewFile} • {previewChunks.length} Chunks
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex flex-col gap-3">
              {loadingPreview ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="font-label-caps text-xs text-on-surface-variant">
                    Fetching vector segments...
                  </span>
                </div>
              ) : previewChunks.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-sm">
                  No chunks found for this document.
                </div>
              ) : (
                previewChunks.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 font-mono text-[11px] uppercase tracking-wider">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                          IDX: {String(chunk.metadata?.chunk_index + 1 || idx + 1).padStart(3, '0')}
                        </span>
                        <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded">
                          PAGE: {chunk.metadata?.page || 1}
                        </span>
                      </div>
                    </div>
                    <p className="font-body-md text-xs md:text-sm text-on-surface/90 leading-relaxed font-light whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
