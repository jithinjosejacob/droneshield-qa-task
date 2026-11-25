import { useEffect, useState } from 'react';
import { createUser, deleteUser, listUsers, updateUserRole } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Role, User } from '../types';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('author');
  const [error, setError] = useState('');

  async function load() {
    setUsers(await listUsers());
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createUser(username, password, role);
      setUsername('');
      setPassword('');
      setRole('author');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create user');
    }
  }

  async function changeRole(u: User, r: Role) {
    await updateUserRole(u.id, r);
    load();
  }

  async function remove(u: User) {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    try {
      await deleteUser(u.id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not delete user');
    }
  }

  return (
    <div>
      <div className="page-head">
        <h2>User administration</h2>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Add user</h3>
        <form className="row gap wrap" onSubmit={add}>
          <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="author">author</option>
            <option value="promoter">promoter</option>
          </select>
          <button className="btn primary">Create</button>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value as Role)} disabled={u.id === me?.id}>
                  <option value="author">author</option>
                  <option value="promoter">promoter</option>
                </select>
              </td>
              <td className="actions">
                <button className="btn danger" onClick={() => remove(u)} disabled={u.id === me?.id}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
