import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { roomService } from '../services/api';
import { DocumentVersion } from '../types';
import { useNotification } from '../components/NotificationProvider';

const RoomHistoryPage: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');

  const { notify } = useNotification();

  const loadHistory = useCallback(async () => {
    if (!guid) return;

    try {
      const versionsData = await roomService.getVersions(guid);
      setVersions(versionsData);
      setRoomName(`Room ${guid?.slice(0, 8)}`);
    } catch (error) {
      console.error('Failed to load history:', error);
      notify('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  }, [guid, notify]);

  useEffect(() => {
    if (guid) {
      loadHistory();
    }
  }, [guid, loadHistory]);

  const handleLoadVersion = async (version: number) => {
    try {
      const versionData = await roomService.getVersion(guid!, version);
      navigate(`/room/${guid}`, {
        state: { content: versionData.content }
      });
    } catch (error) {
      console.error('Failed to load version:', error);
      notify('Failed to load version', 'error');
    }
  };

  const handleDeleteVersion = async (version: number) => {
    if (!window.confirm('Are you sure you want to delete this version?')) {
      return;
    }

    try {
      await roomService.delete(guid!);
      setVersions(versions.filter((v) => v.version !== version));
      notify('Version deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete version:', error);
      notify('Failed to delete version', 'error');
    }
  };

  const handleBack = () => {
    navigate(`/room/${guid}`);
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <Layout fullBleed>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullBleed>
      <div className="room-page text-text-primary">
        <header className="room-page__header">
          <div className="page-header room-page__hero">
            <div className="page-header__eyebrow">Room history</div>
            <h1 className="page-header__title">{roomName}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="badge-pill">
                ID: {guid ? guid.slice(0, 12) : '—'}
              </span>
              <span className="badge-pill">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </header>

        <section className="room-workspace room-workspace--history">
          <aside className="room-workspace__sidebar">
            <div className="room-workspace__actions">
              <button onClick={handleBackToProfile} className="btn btn-outline room-workspace__button">
                Back to Profile
              </button>
              <button onClick={handleBack} className="btn btn-secondary room-workspace__button">
                Back to Room
              </button>
            </div>

            <div className="room-workspace__versions">
              <div className="room-version-card room-version-card--empty">
                <span>Latest</span>
                <strong className="block mt-2 text-text-primary">
                  {versions.length > 0 ? `v${versions[versions.length - 1].version}` : 'none'}
                </strong>
              </div>
              <div className="room-version-card room-version-card--empty">
                <span>Total versions</span>
                <strong className="block mt-2 text-text-primary">{versions.length}</strong>
              </div>
              <div className="room-version-card room-version-card--empty">
                <span>Room ID</span>
                <strong className="block mt-2 text-text-primary">{guid ? guid.slice(0, 12) : '—'}</strong>
              </div>
            </div>
          </aside>

          <section className="room-workspace__editor room-history-content">
            <section className="panel panel--accent room-history-panel">
              <div className="panel__header">
                <div>
                  <h2 className="panel__title">Version History</h2>
                  <p className="panel__subtitle">
                    {versions.length > 0
                      ? `Latest snapshot · v${versions[versions.length - 1].version}`
                      : 'No versions yet'}
                  </p>
                </div>
                <span className="badge-pill">
                  Latest · {versions.length > 0 ? `v${versions[versions.length - 1].version}` : 'none'}
                </span>
              </div>

              {versions.length === 0 ? (
                <div className="text-center text-text-secondary py-16 space-y-4">
                  <p className="font-semibold text-white">No saved versions yet</p>
                  <button onClick={handleBack} className="btn btn-outline">
                    Go Back to Room
                  </button>
                </div>
              ) : (
                <div className="history-grid">
                  {versions.slice().reverse().map((version) => (
                    <article key={version.version} className="history-card">
                      <div className="history-card__header">
                        <div>
                          <div className="flex items-center gap-3 history-card__version-row">
                            <span className="text-xl font-bold">Version {version.version}</span>
                            <span className="badge-pill">#{version.version}</span>
                          </div>
                          <p className="history-card__meta">
                            {new Date(version.created_at).toLocaleString()}
                          </p>
                          <p className="history-card__meta mt-1">
                            {version.content.length} characters
                          </p>
                        </div>
                        <div className="history-card__actions">
                          <button
                            onClick={() => handleLoadVersion(version.version)}
                            className="btn btn-secondary px-3 py-2 text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version.version)}
                            className="btn btn-danger px-3 py-2 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="history-preview">
                        {version.content.length > 300
                          ? `${version.content.substring(0, 350)}...`
                          : version.content}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
      </div>
    </Layout>
  );
};

export default RoomHistoryPage;
