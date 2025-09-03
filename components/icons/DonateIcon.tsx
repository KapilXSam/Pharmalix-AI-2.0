import React from 'react';
import { HeartHandshake } from 'lucide-react';

const DonateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <HeartHandshake {...props} />
);

export default DonateIcon;
