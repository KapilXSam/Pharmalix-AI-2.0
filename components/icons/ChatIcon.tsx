import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <MessageSquare {...props} />
);

export default ChatIcon;
