import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store'; // Adjust path if needed
import { loginUser } from '../../redux/user/user.thunks';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function LoginView() {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('admin@admin.com');
  const navigate = useNavigate();
  const [password, setPassword] = useState('admin');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await dispatch(loginUser({ email, password }));
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Login</h2>
      <Input
        label="Email"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  );
} 