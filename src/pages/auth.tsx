import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Button, Input, Form, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Header from '../components/layout/Header';

const { Title, Text } = Typography;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setError('');
    setLoading(true);
    const { username, password } = values;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.success) {
        router.push('/');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    form.resetFields();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-5xl mx-auto pt-10">
        <Header showAuth={false} />
      </div>
      <div className="flex items-center justify-center flex-1">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center mb-6">
            <Title level={2} className="mb-2">
              {isLogin ? 'Login' : 'Sign Up'}
            </Title>
          </div>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-6"
            />
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input 
                size="large"
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Username"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password"
              />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
            </Form.Item>
          </Form>
          
          <Divider className="my-4" />
          
          <div className="text-center">
            <Text className="text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Button 
                type="link" 
                onClick={toggleAuthMode} 
                className="p-0"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </Button>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}