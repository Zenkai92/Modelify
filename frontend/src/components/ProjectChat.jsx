import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import './ProjectChat.css';

// Intervalle de rafraîchissement de la discussion (polling)
const POLL_INTERVAL_MS = 10000;
const MAX_MESSAGE_LENGTH = 2000;

const ProjectChat = ({ projectId }) => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const isFirstLoad = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    try {
      const response = await apiFetch(`/api/projects/${projectId}/messages`, {
        token: session.access_token,
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des messages');
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      // On n'écrase pas la discussion affichée si un polling échoue
      if (isFirstLoad.current) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, session]);

  // Chargement initial + polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll en bas de la discussion : toujours au premier chargement,
  // ensuite seulement si l'utilisateur est déjà proche du bas.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isFirstLoad.current || nearBottom) {
      container.scrollTop = container.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont autorisées.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image trop volumineuse (max 10 Mo).');
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if ((!content && !imageFile) || sending) return;

    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (imageFile) formData.append('file', imageFile);

      const response = await apiFetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        token: session.access_token,
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Erreur lors de l'envoi du message");
      }
      const data = await response.json();
      setMessages((prev) => [...prev, data.data]);
      setNewMessage('');
      removeImage();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card project-card mt-4">
      <div className="card-body p-4">
        <h5 className="section-title mb-3">
          <span className="section-icon-badge"><i className="bi bi-chat-dots"></i></span>
          Discussion du projet
        </h5>
        <p className="text-muted small mb-3">
          <i className="bi bi-info-circle me-1"></i>
          Posez vos questions et suivez l'avancement de votre projet directement ici.
        </p>

        <div className="chat-messages" ref={messagesContainerRef}>
          {loading ? (
            <div className="text-center py-4">
              <span className="spinner-border spinner-border-sm text-primary"></span>
              <p className="text-muted small mt-2 mb-0">Chargement de la discussion…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty text-center py-4">
              <i className="bi bi-chat-square-text display-6 text-muted d-block mb-2"></i>
              <p className="text-muted small mb-0">
                Aucun message pour le moment. Lancez la discussion !
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`chat-message ${isOwn ? 'chat-message-own' : ''}`}>
                  <div className={`chat-bubble ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
                    <div className="chat-sender">
                      {isOwn ? 'Vous' : msg.senderName}
                      {msg.sender_role === 'admin' && (
                        <span className="badge chat-admin-badge ms-1">Admin</span>
                      )}
                    </div>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.fileUrl} alt="Image jointe" className="chat-image" />
                      </a>
                    )}
                    {msg.content && <div className="chat-content">{msg.content}</div>}
                    <div className="chat-date">{formatMessageDate(msg.created_at)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle me-1"></i>{error}
          </div>
        )}

        {imagePreview && (
          <div className="chat-image-preview mt-2">
            <img src={imagePreview} alt="Aperçu" />
            <button
              type="button"
              className="btn-close chat-image-preview-remove"
              aria-label="Retirer l'image"
              onClick={removeImage}
            ></button>
          </div>
        )}

        <div className="chat-input-row mt-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="d-none"
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="btn btn-light border chat-attach-btn"
            title="Joindre une image"
            onClick={() => imageInputRef.current?.click()}
            disabled={sending}
          >
            <i className="bi bi-image"></i>
          </button>
          <textarea
            className="form-control chat-textarea"
            rows="1"
            placeholder="Écrivez votre message…"
            value={newMessage}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          ></textarea>
          <button
            type="button"
            className="btn btn-gradient-primary chat-send-btn"
            onClick={handleSend}
            disabled={sending || (!newMessage.trim() && !imageFile)}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-send-fill"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectChat;
