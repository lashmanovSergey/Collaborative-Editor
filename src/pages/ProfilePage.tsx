import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { authService, roomService } from '../services/api';
import { User, Room } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userData, roomsData] = await Promise.all([
        authService.getProfile(),
        roomService.list(),
      ]);
      setUser(userData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreatingRoom(true);
    try {
      const newRoom = await roomService.create({ name: newRoomName });
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
      setShowCreateRoom(false);
      navigate(`/room/${newRoom.guid}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (guid: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await roomService.delete(guid);
      setRooms(rooms.filter((room) => room.guid !== guid));
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const handleViewHistory = (guid: string) => {
    navigate(`/room/${guid}/history`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-10 text-text-primary">
        <header className="page-header">
          <div className="page-header__eyebrow">Your workspace</div>
          <h1 className="page-header__title">
            Welcome back, <span className="text-gradient">{user?.username}</span>
          </h1>
          <p className="page-header__subtitle">
            Manage your collaborative editing rooms and work together with your team in real-time.
          </p>
        </header>

        <section className="panel panel--accent">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Your Rooms</h2>
              <p className="panel__subtitle">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} available • Last updated just now
              </p>
            </div>
            <button onClick={() => setShowCreateRoom(true)} className="btn">
              <span className="mr-2">+</span>
              Create New Room
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center text-text-secondary space-y-6 py-12">
              <div className="text-8xl">🚪</div>
              <p className="text-xl font-semibold">No rooms yet</p>
              <p className="text-sm max-w-md mx-auto">
                Create your first collaborative editing room to start working with others in real-time.
              </p>
              <button onClick={() => setShowCreateRoom(true)} className="btn btn-outline">
                Create Your First Room
              </button>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <article key={room.guid} className="room-card">
                  <div>
                    <div className="room-card__header">
                      <span className="text-2xl">📁</span>
                      <h3 className="room-card__title">{room.name}</h3>
                    </div>
                    <div className="room-card__meta">
                      <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                      <span>
                        ID: <code className="text-xs">{room.guid.slice(0, 8)}...</code>
                      </span>
                    </div>
                  </div>
                  <div className="room-card__actions">
                    <button
                      onClick={() => navigate(`/room/${room.guid}`)}
                      className="btn btn-secondary flex-1"
                    >
                      Open Room
                    </button>
                    <button
                      onClick={() => handleViewHistory(room.guid)}
                      className="btn btn-outline flex-1"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.guid)}
                      className="btn btn-danger flex-1"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreateRoom && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center space-x-4">
                <h3 className="modal-title text-2xl font-bold">Create New Room</h3>
              </div>
              <button onClick={() => setShowCreateRoom(false)} className="modal-close">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="modal-body space-y-8">
                <div className="form-group">
                  <label htmlFor="roomName" className="label text-lg font-medium">
                    Room Name
                  </label>
                  <input
                    id="roomName"
                    type="text"
                    className="input"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter a descriptive room name (e.g., 'Project Backend', 'Team Meeting Notes')"
                    required
                    autoFocus
                  />
                  <p className="text-sm text-text-secondary mt-3 font-light">
                    Choose a name that helps you identify the room's purpose with your team.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateRoom(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="btn"
                >
                  {creatingRoom ? (
                    <>
                      <span className="loading mr-3"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Create Room
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
