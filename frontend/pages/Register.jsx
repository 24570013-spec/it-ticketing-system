import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <h2 style={{ marginTop: 0 }}>Register</h2>
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Register
        </button>
      </form>
      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
