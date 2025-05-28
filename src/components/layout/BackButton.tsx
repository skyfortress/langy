import React from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { IoArrowBack } from 'react-icons/io5';

const BackButton: React.FC = () => {
  return (
    <Link href="/" className="inline-block mb-4">
      <Button type="text" icon={<IoArrowBack className="h-5 w-5" />}>
        Back to Home
      </Button>
    </Link>
  );
};

export default BackButton;