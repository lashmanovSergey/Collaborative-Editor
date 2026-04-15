import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Editor from '../components/Editor';
import { roomService } from '../services/api';
import { DocumentVersion } from '../types';
import { useNotification } from '../components/NotificationProvider';

const RoomPage: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [roomName, setRoomName] = useState('');
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeVersion, setActiveVersion] = useState<number | null>(null);

  const loadRoomData = useCallback(async () => {
    if (!guid) return;

    try {
      const versionsData = await roomService.getVersions(guid);
      setVersions(versionsData);

      if (versionsData.length > 0) {
        const latestVersion = versionsData[versionsData.length - 1];
        setContent(latestVersion.content);
        setActiveVersion(latestVersion.version);
      }

      setRoomName(`Room ${guid?.slice(0, 8)}`);
    } catch (error) {
      console.error('Failed to load room:', error);
      setError('Failed to load room data');
    } finally {
      setLoading(false);
    }
  }, [guid]);

  useEffect(() => {
    if (guid) {
      loadRoomData();
    }
  }, [guid, loadRoomData]);

  const handleSave = async (contentToSave: string) => {
    if (!guid) return;

    setSaving(true);
    try {
      await roomService.createVersion(guid, contentToSave);
      const versionsData = await roomService.getVersions(guid);
      setVersions(versionsData);
      if (versionsData.length > 0) {
        const latestVersion = versionsData[versionsData.length - 1];
        setActiveVersion(latestVersion.version);
      }
      notify('Room saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save room:', error);
      setError('Failed to save room');
      notify('Failed to save room', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadVersion = async (version: number) => {
    if (!guid) return;

    try {
      const versionData = await roomService.getVersion(guid, version);
      setContent(versionData.content);
      setActiveVersion(versionData.version);
    } catch (error) {
      console.error('Failed to load version:', error);
      setError('Failed to load version');
    }
  };

  const handleCopyLink = () => {
    if (!guid) return;

    const url = `${window.location.origin}/room/${guid}`;
    navigator.clipboard.writeText(url)
      .then(() => notify('Copied room link to clipboard', 'success'))
      .catch(() => notify('Could not copy the room link', 'error'));
  };

  const handleBack = () => {
    navigate('/profile');
  };

  const recentVersions = versions.slice(-4).reverse();
  if (loading) {
    return (
      <Layout fullBleed>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullBleed>
      <div className="room-page text-text-primary">
        {error && (
          <div className="notification notification--error room-error-banner">
            <div>
              <p className="font-semibold text-white">{error}</p>
              <p className="text-xs text-text-tertiary mt-1">
                Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        )}

        <header className="room-page__header">
          <div className="page-header room-page__hero">
            <div className="page-header__eyebrow">Room workspace</div>
            <h1 className="page-header__title">{roomName}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="badge-pill">ID: {guid?.slice(0, 12)}...</span>
              <span className="badge-pill">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </header>

        <section className="room-workspace">
          <aside className="room-workspace__sidebar">
            <div className="room-workspace__actions">
              <button onClick={handleBack} className="btn btn-outline room-workspace__button">
                Back to Profile
              </button>
              <button
                onClick={() => navigate(`/room/${guid}/history`)}
                className="btn btn-outline room-workspace__button"
              >
                View History
              </button>
              <button
                onClick={handleCopyLink}
                className="btn btn-outline room-workspace__button"
              >
                Copy Room Link
              </button>
              <button
                onClick={() => handleSave(content)}
                disabled={saving}
                className="btn room-workspace__button"
              >
                {saving ? (
                  <>
                    <span className="loading mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Room'
                )}
              </button>
            </div>

            <div className="room-workspace__versions">
              {recentVersions.length === 0 ? (
                <div className="room-version-card room-version-card--empty">
                  <span>No saved versions yet.</span>
                </div>
              ) : (
                recentVersions.map((version) => (
                  <button
                    key={version.version}
                    type="button"
                    onClick={() => handleLoadVersion(version.version)}
                    className={`room-version-card ${activeVersion === version.version ? 'room-version-card--active' : ''}`}
                  >
                    <div className="room-version-card__meta">
                      <span className="room-version-card__tag">v{version.version}</span>
                      <span className="room-version-card__timestamp">
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                    <pre className="room-version-card__preview">
                      {version.content.length > 140
                        ? `${version.content.slice(0, 140)}...`
                        : version.content}
                    </pre>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="room-workspace__editor">
            <div className="editor-shell editor-shell--room">
              <Editor
                roomGuid={guid!}
                initialContent={content}
                onContentChange={setContent}
                onSave={handleSave}
                isSaving={saving}
                showToolbarSave={false}
              />
            </div>
          </section>
        </section>
      </div>
    </Layout>
  );
};

export default RoomPage;
